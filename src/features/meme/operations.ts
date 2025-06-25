import { HttpError } from 'wasp/server';
import { Rettiwt } from 'rettiwt-api';
import OpenAI from 'openai';
import type { GenerateSituationMeme } from 'wasp/server/operations';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type MemeGenerationInput = {
  handle: string;
};

type MemeGenerationOutput = {
  situation: string;
  profileImageUrl: string;
  handle: string;
};
export const generateSituationMeme: GenerateSituationMeme<MemeGenerationInput, MemeGenerationOutput> = async (
  args,
  context
)  => {
  if (!args.handle) {
    throw new HttpError(400, 'Twitter handle is required.');
  }

  // 1. Check for a recent cached analysis
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cachedAnalysis = await context.entities.UserAnalysis.findFirst({
    where: {
      handle: { equals: args.handle },
      updatedAt: { gte: twentyFourHoursAgo },
    },
  });

  if (cachedAnalysis) {
    console.log(`Returning cached analysis for @${args.handle}.`);
    return {
      situation: cachedAnalysis.situation,
      profileImageUrl: cachedAnalysis.profileImageUrl,
      handle: args.handle,
    };
  }

  console.log(`No recent cache found. Generating new analysis for @${args.handle}.`);

  // 2. If no cache, proceed with fetching and analysis
  const rettiwt = new Rettiwt();

  try {
    const userDetailsResult = await rettiwt.user.details(args.handle);
    if (!userDetailsResult) {
      throw new HttpError(404, `User with handle @${args.handle} not found.`);
    }

    // Ensure we are dealing with a single user object
    const userDetails = Array.isArray(userDetailsResult) ? userDetailsResult[0] : userDetailsResult;
    if (!userDetails) {
      throw new HttpError(404, `User details for @${args.handle} could not be resolved.`);
    }

    const timeline = await rettiwt.user.timeline(userDetails.id);
    if (!timeline.list || timeline.list.length === 0) {
      throw new HttpError(404, `No tweets found for @${args.handle}.`);
    }

    const tweetDataForAnalysis = timeline.list
      .slice()
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .map((tweet) => `Tweet ${tweet.id}: "${tweet.fullText}" \\nView Count: ${tweet.viewCount}\\nURL: https://twitter.com/${userDetails.userName}/status/${tweet.id}`)
      .join('\\n---\\n');

    console.log(tweetDataForAnalysis);

    const analysis = await openai.chat.completions.create({
      // model: 'chatgpt-4o-latest', // Or another suitable model
      // model: 'gpt-4.1-2025-04-14',
      model: 'o3-2025-04-16',
      messages: [
        {
          role: 'system',
          content: `You are an expert comedian and analyst. Your job is to analyze a user's recent tweets, find the most popular ones, and determine the main "situation" they seem to be "monitoring". A situation is a short, funny, noun phrase (e.g., "the stock market," "the local raccoon problem," "the bad first dates", "the isreal-iran conflict", "the getting fired from your job", "the being retarded"). Don't be afraid to be politically-incorrect. The situation should be straight to the point and not too long. Do not reference the user's name or handle in your response. Reference specific tweets as the situation and USE THEIR OWN WORDS over general concepts. You want the user to feel like you're speaking directly to them. You must also identify the single most representative tweet URL for this situation. The URL is provided with each tweet.`,
        },
        {
          role: 'user',
          content: `Here are the user's details:\\n\\n${userDetails}\\n\\nHere are their tweets with their URLs:\\n\\n${tweetDataForAnalysis}`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'reportSituation',
            description: 'Reports the identified situation and the most representative tweet.',
            parameters: {
              type: 'object',
              properties: {
                situation: {
                  type: 'string',
                  description: 'A short, descriptive noun phrase for the situation being monitored, starting with "the". E.g., "the upcoming election" or "the neighborhood cat drama".',
                },
                representativeTweetUrl: {
                  type: 'string',
                  description: 'The full URL to the single tweet that best represents the identified situation.',
                },
              },
              required: ['situation', 'representativeTweetUrl'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'reportSituation' } },
    });
    
    const toolCall = analysis.choices[0].message.tool_calls?.[0];
    if (!toolCall) { throw new HttpError(500, 'AI analysis failed.') }
    const { situation: originalSituation } = JSON.parse(toolCall.function.arguments);

    // Ensure the situation starts with "the"
    const situation = originalSituation.toLowerCase().startsWith('the ')
      ? originalSituation
      : `the ${originalSituation}`;

    console.log(`AI Analysis complete. Situation: ${situation}`);

    // 3. Save the new analysis to the database
    await context.entities.UserAnalysis.upsert({
      where: { handle: args.handle },
      create: {
        handle: args.handle,
        situation: situation,
        profileImageUrl: userDetails.profileImage,
      },
      update: {
        situation: situation,
        profileImageUrl: userDetails.profileImage,
      },
    });

    return {
      situation,
      profileImageUrl: userDetails.profileImage,
      handle: args.handle,
    };
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Error during AI analysis or tweet fetching:', error);
    throw new HttpError(500, 'An error occurred during the process.');
  }
}; 