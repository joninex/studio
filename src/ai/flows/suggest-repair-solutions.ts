'use server';

/**
 * @fileOverview AI-powered repair solution suggestion flow.
 *
 * - suggestRepairSolutions - A function that suggests possible repair solutions based on device model and fault description.
 * - SuggestRepairSolutionsInput - The input type for the suggestRepairSolutions function.
 * - SuggestRepairSolutionsOutput - The return type for the suggestRepairSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRepairSolutionsInputSchema = z.object({
  deviceModel: z.string().describe('The model of the device that needs repair.'),
  faultDescription: z.string().describe('The customer provided description of the fault.'),
});
export type SuggestRepairSolutionsInput = z.infer<typeof SuggestRepairSolutionsInputSchema>;

const SuggestRepairSolutionsOutputSchema = z.object({
  possibleCauses: z.string().describe('Possible causes for the described fault.'),
  suggestedSolutions: z.string().describe('Suggested solutions for the described fault.'),
});
export type SuggestRepairSolutionsOutput = z.infer<typeof SuggestRepairSolutionsOutputSchema>;

export async function suggestRepairSolutions(input: SuggestRepairSolutionsInput): Promise<SuggestRepairSolutionsOutput> {
  return suggestRepairSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRepairSolutionsPrompt',
  input: {schema: SuggestRepairSolutionsInputSchema},
  output: {schema: SuggestRepairSolutionsOutputSchema},
  prompt: `You are an expert technician. Based on the device model and the customer's description of the fault, suggest possible causes and solutions.

Device Model: {{{deviceModel}}}
Fault Description: {{{faultDescription}}}

Possible Causes:
Suggested Solutions: `,
});

const suggestRepairSolutionsFlow = ai.defineFlow(
  {
    name: 'suggestRepairSolutionsFlow',
    inputSchema: SuggestRepairSolutionsInputSchema,
    outputSchema: SuggestRepairSolutionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
