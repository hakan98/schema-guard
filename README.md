# 🛡️ SchemaGuard — AI-Powered API Drift Detector

**Stop guessing if the backend change broke your frontend.** SchemaGuard is a smart developer tool that compares two versions of an OpenAPI/Swagger schema (or any JSON object), identifies breaking changes, and uses **GPT-4o** to provide instant impact analysis.

## 🚀 Why SchemaGuard?

In modern development, backend and frontend teams often get out of sync. A renamed field or a type change in the API can crash your app. SchemaGuard catches these issues before they reach production.

## ✨ Key Features

- **Smart Diffing:** Instantly detects added, removed, or modified fields between two JSON schemas.
- **Generic JSON Support:** Works with any JSON object, not just OpenAPI specs.
- **Breaking Change Alerts:** Specifically highlights changes that will break your TypeScript interfaces.
- **AI Analysis (GPT-4o):** Explains *why* a change matters and provides the updated TypeScript code you need.
- **Modern UI:** Built with Next.js 15, Tailwind CSS, and Shadcn/UI for a seamless developer experience.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **AI Engine:** OpenAI GPT-4o
- **Database:** Prisma (PostgreSQL)

## 📦 Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/hakan-toygun/schema-guard.git
   cd schema-guard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_key
   DATABASE_URL="postgresql://user:password@localhost:5432/schema_guard"
   ```

4. **Prepare the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License

This project is licensed under the [MIT License](LICENSE).