import * as addressSchema from './../address.json';
import * as educationSchema from './../education.json';

import { correctAddress, correctEducation } from './data';

import Ajv from 'ajv';

const ajv = new Ajv();
ajv.addSchema(addressSchema, 'address');
ajv.addSchema(educationSchema, 'education');

describe('JSON-Schema Address', () => {
  it('should parse address correctly', () => {
    const validate = ajv.compile(addressSchema);
    const valid = validate(correctAddress);
    expect(valid).toBeTruthy();
  });

  it('should parse null/undefined address incorrectly', () => {
    const validate = ajv.compile(addressSchema);
    expect(validate({})).toBeFalsy();
    expect(validate(undefined)).toBeFalsy();
  });

  it('should fail parsing address with missing fields', () => {
    const validate = ajv.compile(addressSchema);
    const correctAddressCopy = JSON.parse(JSON.stringify(correctAddress));
    delete correctAddressCopy.city;
    const valid = validate(correctAddressCopy);
    expect(validate.errors[0].params).toHaveProperty('missingProperty');
    expect(validate.errors[0].params.missingProperty).toEqual('city');
    expect(valid).toBeFalsy();
  });
});

describe('JSON-Schema Education', () => {
  const validate = ajv.compile(educationSchema);

  it('should parse Education correctly', () => {
    const valid = validate(correctEducation);
    expect(valid).toBeTruthy();
  });

  it('should parse null/undefined Education incorrectly', () => {
    expect(validate({})).toBeFalsy();
    expect(validate(undefined)).toBeFalsy();
  });

  it('should fail parsing Education with missing fields in address - city', () => {
    const correctEducationCopy = JSON.parse(JSON.stringify(correctEducation));
    delete correctEducationCopy.address.city;
    const valid = validate(correctEducationCopy);
    expect(validate.errors[0].params).toHaveProperty('missingProperty');
    expect(validate.errors[0].params.missingProperty).toEqual('city');
    expect(valid).toBeFalsy();
  });
});

describe('JSON-Schema Education', () => {
  const validate = ajv.compile(educationSchema);

  it('should parse Education correctly', () => {
    const valid = validate(correctEducation);
    expect(valid).toBeTruthy();
  });

  it('should parse null/undefined Education incorrectly', () => {
    expect(validate({})).toBeFalsy();
    expect(validate(undefined)).toBeFalsy();
  });

  it('should fail parsing Education with missing fields in address - city', () => {
    const correctEducationCopy = JSON.parse(JSON.stringify(correctEducation));
    delete correctEducationCopy.address.city;
    const valid = validate(correctEducationCopy);
    expect(validate.errors[0].params).toHaveProperty('missingProperty');
    expect(validate.errors[0].params.missingProperty).toEqual('city');
    expect(valid).toBeFalsy();
  });
});

