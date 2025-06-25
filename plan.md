# Situation Monitor: Actionable Development Plan

This document outlines the step-by-step plan for building the "Situation Monitor" application. It follows a **Vertical Slice Phased Approach**, where we'll build the core backend functionality end-to-end first, and then build the user interface on top of it.

---

## Phase 1: Project Setup & Backend Foundation

**Goal:** Prepare the development environment and create the skeleton for our main backend logic.

- [ ] **1.1: Install Dependencies**
  - Install `openai` for AI analysis.
  - Install `twitter-api-v2` to fetch tweets.
  - Install `axios` for making HTTP requests to the screenshot and meme APIs.
  - **Command:** `npm install openai twitter-api-v2 axios`

- [ ] **1.2: Configure Environment Variables**
  - Create a `.env.server` file in the project root.
  - Add placeholders for all required API keys and secrets.
    ```env
    OPENAI_API_KEY="your_key_here"
    IMGFLIP_USERNAME="your_username_here"
    IMGFLIP_PASSWORD="your_password_here"
    # Found in your X.com (Twitter) Developer Portal
    TWITTER_APP_KEY="your_key_here"
    TWITTER_APP_SECRET="your_key_here"
    TWITTER_ACCESS_TOKEN="your_token_here"
    TWITTER_ACCESS_SECRET="your_secret_here"
    ```

- [ ] **1.3: Define Wasp Action**
  - In `main.wasp`, define a new Wasp `action` named `generateSituationMeme`.
  - This action will point to an implementation function in a new file: `@src/features/meme/operations.ts`.

- [ ] **1.4: Create Backend Skeleton**
  - Create the directory `src/features/meme`.
  - Create the file `src/features/meme/operations.ts`.
  - Implement a skeleton for the `generateSituationMeme` function. It will initially just accept the arguments and log them.

---

## Phase 2: Core Logic - Tweet Fetching & AI Analysis

**Goal:** Implement the first two major steps of the backend logic: getting tweets and analyzing them with OpenAI.

- [ ] **2.1: Implement Tweet Fetching**
  - In `src/features/meme/operations.ts`, add the logic to initialize the `twitter-api-v2` client using the environment variables.
  - Implement the part of the `generateSituationMeme` action that fetches the recent tweets for a given user handle.

- [ ] **2.2: Implement OpenAI Analysis**
  - In the same file, initialize the OpenAI client.
  - Create the function-calling schema for OpenAI. The function should be designed to extract two things:
    1. `situation`: A short, descriptive string of the situation the user is monitoring (e.g., "the gardening situation").
    2. `representativeTweetUrl`: The URL of the single tweet that best represents this situation.
  - Add the logic to pass the tweet content to the OpenAI API and parse the function-calling response.

---

## Phase 3: Core Logic - Image and Meme Generation

**Goal:** Complete the backend action by adding the final two steps: screenshotting the tweet and generating the meme.

- [ ] **3.1: Implement Tweet Screenshot**
  - We'll use the `microlink.io` screenshot API for simplicity.
  - In `src/features/meme/operations.ts`, add a call using `axios` to the Microlink API. It should take the `representativeTweetUrl` from the OpenAI response and request a screenshot.
  - **URL Format:** `https://api.microlink.io/?url={ENCODED_TWEET_URL}&screenshot=true&meta=false&embed=screenshot.url`

- [ ] **3.2: Implement Imgflip Meme Generation**
  - In the same file, add the logic to call the `imgflip.com` API (`api.imgflip.com/caption_image`).
  - We will use the **"Drake Hotline Bling"** template (Template ID: `181913649`).
  - The top text will be static (e.g., "Normal Tweets").
  - The bottom text will be the dynamic `situation` string from the OpenAI response (e.g., "Monitoring the gardening situation").
  - The action should return the URL of the generated meme from the Imgflip API response.

---

## Phase 4: Frontend Implementation

**Goal:** Build a simple user interface to interact with our completed backend action.

- [ ] **4.1: Define Wasp Page & Route**
  - In `main.wasp`, define a `HomePage` and a root route `/` that points to it.
  - The page component will be located at `@src/features/meme/HomePage.tsx`.

- [ ] **4.2: Create the UI Layout**
  - Create the file `src/features/meme/HomePage.tsx`.
  - Use `shadcn/ui` components (`Card`, `Input`, `Button`) to build a simple form where a user can enter a Twitter handle.

- [ ] **4.3: Connect UI to Backend**
  - In `HomePage.tsx`, use the `generateSituationMeme` action from `wasp/client/operations`.
  - When the user clicks the "Generate" button, call the action with the Twitter handle from the input field.

- [ ] **4.4: Display Results & Loading/Error States**
  - Manage the component's state (e.g., using `useState`).
  - Show a loading indicator while the action is running.
  - If the action returns a meme URL, display the image.
  - If the action throws an error, display a user-friendly error message.

--- 