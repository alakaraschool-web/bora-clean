import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Button } from './Button';

export const ImageAI = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateImage = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: '1:1', imageSize: '1K' } },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Image AI</h2>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        placeholder="Enter a prompt to generate an image"
      />
      <Button onClick={generateImage} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Image'}
      </Button>
      {imageUrl && <img src={imageUrl} alt="Generated" className="mt-4" />}
    </div>
  );
};
