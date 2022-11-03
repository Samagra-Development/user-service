import { Injectable, InternalServerErrorException, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigResolverService } from '../../api/config.resolver.service';
import { UUID } from '@fusionauth/typescript-client';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class HasuraService {
  private readonly hasuraGraphqlUrl: string;
  private readonly hasuraGraphqlSecret: string;
  private readonly mutations: object;

  protected readonly logger = new Logger(HasuraService.name); // logger instance

  constructor(
    applicationId: UUID,
    private readonly configResolverService: ConfigResolverService,
    private readonly httpService: HttpService,
  ) {
    const hasuraConfig = configResolverService.getHasura(applicationId);
    if (!hasuraConfig) {
      throw new NotImplementedException(`Hasura config not supported/implemented for application: ${applicationId}.`);
    }
    this.hasuraGraphqlUrl = hasuraConfig.graphql_url;
    this.hasuraGraphqlSecret = hasuraConfig.admin_secret;
    this.mutations = hasuraConfig.mutations
  }

  async hasuraGraphQLCall(
    mutationKey: string,
    payload: object,
    url: string = this.hasuraGraphqlUrl,
    headers = {
      'x-hasura-admin-secret': this.hasuraGraphqlSecret,
      'Content-Type': 'application/json',
    },
  ) {
    const mutation = this.mutations[mutationKey] || undefined;
    if (!mutation) {
      throw new NotImplementedException('Mutation not supported.');
    }
    this.logger.debug(`Running mutation for:-\n - mutationKey: ${mutationKey} \n - mutation: ${mutation} \n - payload: ${JSON.stringify(payload)}`);
    const data = {
      query: `${mutation}`,
      variables: payload,
    }
    return await lastValueFrom(
      this.httpService
        .post(url, data, {
          headers: headers,
        })
        .pipe(
          map((res) => {
            if (res?.data?.errors) {
              // log the error globally & throw 500
              this.logger.error('GraphQl Errors:', JSON.stringify(res));
              throw new InternalServerErrorException(null, 'Mutations failed to execute.');
            }
            const response = res.status == 200 ? res.data : null;
            this.logger.verbose(`Mutation result: ${JSON.stringify(response)}`);
            return response;
          }),
        ),
    );
  }
}
