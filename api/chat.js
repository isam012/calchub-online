// api/chat.js - Vercel Serverless Function
// This file runs on the server - API key is SAFE here

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers - allow your site to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { prompt } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a question.' });
  }

  // Get API key from Vercel environment variable (SECURE - never exposed to users)
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API configuration error.' });
  }

  // System prompt - makes AI act as a financial calculator assistant
  const systemPrompt = `You are CalcHub AI, a helpful financial calculator assistant on CalcHub.com — a product of Sana.

Your role:
- Help users understand financial concepts (mortgages, loans, EMI, compound interest, investments, taxes, retirement)
- Guide users to use the right CalcHub calculator for their needs
- Give clear, simple explanations with numbers when helpful
- Be friendly, concise, and practical

Available calculators on CalcHub:
- Mortgage Calculator (mortgage-calculator.html)
- Refinance Calculator (refinance-calculator.html)  
- Amortization Calculator (amortization-calculator.html)
- Home Affordability Calculator (home-affordability-calculator.html)
- Loan / EMI Calculator (loan-calculator.html)
- Auto Loan Calculator (auto-loan-calculator.html)
- Credit Card Interest Calculator (credit-card-interest-calculator.html)
- Credit Card Payoff Calculator (credit-card-payoff-calculator.html)
- Debt Payoff Calculator (debt-payoff-calculator.html)
- Compound Interest Calculator (compound-interest-calculator.html)
- Investment / ROI Calculator (investment-calculator.html)
- Retirement Calculator (retirement-calculator.html)
- Inflation Calculator (inflation-calculator.html)
- Salary After Tax Calculator (salary-after-tax-calculator.html)
- Income Tax Calculator (income-tax-calculator.html)

Rules:
- Keep answers under 150 words
- Always suggest the relevant calculator when applicable
- Never give specific legal or certified financial advice
- Support questions in English and Hindi
- Use simple language`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + '\n\nUser question: ' + prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.8,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'No response from AI. Please try again.' });
    }

    return res.status(200).json({ text: text.trim() });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
