'use server';
/**
 * @fileOverview An AI flow to generate step-by-step repair guides.
 *
 * - getProcedureSteps - A function that calls the Genkit flow.
 * - GetProcedureStepsInput - The input schema for the flow.
 * - GetProcedureStepsOutput - The output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GetProcedureStepsInputSchema = z.object({
  procedureName: z.string().describe('The name of the repair procedure, e.g., "iPhone 11 screen replacement".'),
});
export type GetProcedureStepsInput = z.infer<typeof GetProcedureStepsInputSchema>;

export const GetProcedureStepsOutputSchema = z.object({
  procedureTitle: z.string().describe('A clear and concise title for the generated guide.'),
  toolsRequired: z.array(z.string()).describe('A list of tools and equipment required for the procedure.'),
  importantNotes: z.array(z.string()).describe('A list of important warnings, precautions, or tips.'),
  steps: z.array(z.string()).describe('An ordered list of steps to follow to complete the procedure.'),
});
export type GetProcedureStepsOutput = z.infer<typeof GetProcedureStepsOutputSchema>;


export async function getProcedureSteps(input: GetProcedureStepsInput): Promise<GetProcedureStepsOutput> {
  return getProcedureStepsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getProcedureStepsPrompt',
  input: {schema: GetProcedureStepsInputSchema},
  output: {schema: GetProcedureStepsOutputSchema},
  prompt: `You are an expert mobile device repair technician. Your task is to generate a clear, step-by-step guide for the following repair procedure: {{{procedureName}}}.

  Your response must be structured according to the output schema.

  - procedureTitle: Create a clear title for the guide. For example, "Guía de Reemplazo de Pantalla para iPhone 11".
  - toolsRequired: List all the necessary tools. Be specific (e.g., "Pentalobe P2 screwdriver", "iSclack or suction cup", "Spudger").
  - importantNotes: Provide crucial warnings or tips. For example, "Disconnect the battery before any other component to avoid short circuits," or "Be careful with the Face ID sensor flex cable, as damaging it will permanently disable Face ID."
  - steps: Provide a detailed, numbered list of steps for the repair. The steps should be clear, concise, and easy to follow for another technician.

  Generate the guide in Spanish.`,
});


const getProcedureStepsFlow = ai.defineFlow(
  {
    name: 'getProcedureStepsFlow',
    inputSchema: GetProcedureStepsInputSchema,
    outputSchema: GetProcedureStepsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
