/**
 * @fileOverview Centralized Genkit initialization.
 * This file configures and exports the `ai` object for use throughout the application.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
