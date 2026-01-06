// Environment variables configuration
// This file exports environment variables from .env file

import { MASTER_PASSWORD } from '@env';

// Master password for development/testing purposes only
// WARNING: Do not use in production!
export const MASTER_KEY = MASTER_PASSWORD || '';

// Check if master password is enabled
export const isMasterPasswordEnabled = (): boolean => {
  return MASTER_KEY !== '' && MASTER_KEY !== undefined;
};
