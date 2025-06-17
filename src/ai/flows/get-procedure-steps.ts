
'use server';
/**
 * @fileOverview AI-powered procedural guide for technicians.
 *
 * - getProcedureSteps - A function that returns detailed steps and notes for a given repair procedure.
 * - GetProcedureStepsInput - The input type for the getProcedureSteps function.
 * - GetProcedureStepsOutput - The return type for the getProcedureSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetProcedureStepsInputSchema = z.object({
  procedureName: z.string().describe('The name of the repair procedure for which steps are requested (e.g., "iPhone X screen replacement", "Samsung S21 battery diagnostic").'),
});
export type GetProcedureStepsInput = z.infer<typeof GetProcedureStepsInputSchema>;

const GetProcedureStepsOutputSchema = z.object({
  procedureTitle: z.string().describe('A clear title for the procedure.'),
  steps: z.array(z.string()).describe('An ordered list of detailed steps to perform the procedure.'),
  importantNotes: z.array(z.string()).describe('A list of important notes, warnings, or special considerations for this procedure.'),
  toolsRequired: z.array(z.string()).describe('A list of tools typically required for this procedure.'),
});
export type GetProcedureStepsOutput = z.infer<typeof GetProcedureStepsOutputSchema>;

export async function getProcedureSteps(input: GetProcedureStepsInput): Promise<GetProcedureStepsOutput> {
  return getProcedureStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getProcedureStepsPrompt',
  input: {schema: GetProcedureStepsInputSchema},
  output: {schema: GetProcedureStepsOutputSchema},
  prompt: `You are an expert repair technician and technical writer.
Your task is to provide a detailed, step-by-step guide for the following repair procedure: {{{procedureName}}}.

Please structure your response with:
1.  A clear "procedureTitle" for the requested task.
2.  A list of "steps", making each step clear, concise, and actionable.
3.  A list of "importantNotes" including any warnings, safety precautions, or common pitfalls.
4.  A list of "toolsRequired" for the procedure.

Focus on accuracy and clarity for a technician to follow.

Procedure Request: {{{procedureName}}}
`,
});

const getProcedureStepsFlow = ai.defineFlow(
  {
    name: 'getProcedureStepsFlow',
    inputSchema: GetProcedureStepsInputSchema,
    outputSchema: GetProcedureStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for procedure steps.');
    }
    return output;
  }
);
