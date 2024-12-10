import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  constructor(
    private readonly configService: ConfigService
  ) {}

  async sendEvent(
    eventData: any,
    eventId: string,
    event: string,
    subEvent: string,
    generator?: string,
    userId?: string,
  ): Promise<any> {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    console.log([
      {
        generator,
        version: '0.0.1',
        timestamp: Math.floor(new Date().getTime() / 1000),
        actorId: userId,
        actorType: 'User',
        env: this.configService.get('ENVIRONMENT'),
        eventId,
        event,
        subEvent,
        eventData,
      },
    ]);

    const raw = JSON.stringify([
      {
        generator,
        version: '0.0.1',
        timestamp: Math.floor(new Date().getTime() / 1000),
        actorId: userId,
        actorType: 'User',
        env: this.configService.get('ENVIRONMENT'),
        eventId,
        event,
        subEvent,
        eventData,
      },
    ]);

    const requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
      retry: 1,
    };

    try {
      const response = await fetch(
        `${this.configService.get('TELEMETRY_INTERNAL_BASE_URL')}/metrics/v1/save`,
        requestOptions,
      );
      this.logger.verbose(`Sucessfully sent ${subEvent} event`);
      return response.body;
    } catch (error) {
      this.logger.error(`Failed to send ${subEvent} event.`);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
