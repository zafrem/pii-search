#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from src.config import config
from src.prompt_manager import PromptManager
from src.ollama_client import ollama_client
from src.models import DetectedEntity, PIIType, ConfidenceLevel, Position

async def test_context_analysis():
    print(f"Using model: {config.ollama_model}")
    
    # Initialize prompt manager
    prompt_manager = PromptManager()
    await prompt_manager.initialize()
    
    # Test entity
    entity = DetectedEntity(
        id="test1",
        text="John Smith",
        type=PIIType.NAME,
        language="english",
        position=Position(start=11, end=21),
        probability=0.9,
        confidence_level=ConfidenceLevel.HIGH
    )
    
    # Test text
    text = "My name is John Smith and I live in California"
    context = text[max(0, 11-50):min(len(text), 21+50)]
    
    print(f"Entity: {entity.text}")
    print(f"Context: {context}")
    
    # Get prompt template before formatting
    prompt_template = prompt_manager.prompts.get("context_analysis", "not found")
    print(f"\nPrompt template from config: {repr(prompt_template)}")
    
    # Get prompt
    prompt = prompt_manager.get_context_analysis_prompt(
        text=context,
        entity=entity.text,
        type=entity.type.value,
        start=entity.position.start,
        end=entity.position.end
    )
    
    print(f"\nPrompt:\n{prompt}")
    
    # Test with ollama client directly
    async with ollama_client as client:
        try:
            # Direct ollama request
            from src.models import OllamaRequest
            # The prompt is already formatted by the prompt manager
            formatted_prompt = prompt
            
            print(f"\nFormatted prompt: {repr(formatted_prompt)}")
            
            request = OllamaRequest(
                model="llama3.2:1b",
                prompt=formatted_prompt,
                stream=False,
                options={
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "max_tokens": 300
                }
            )
            
            ollama_response = await client.generate(request)
            print(f"\nOllama raw response: {repr(ollama_response.response)}")
            
            # Try JSON parsing
            import json
            try:
                parsed = json.loads(ollama_response.response.strip())
                print(f"\nSuccessfully parsed JSON: {parsed}")
            except json.JSONDecodeError as e:
                print(f"\nJSON parse error: {e}")
                print(f"Response length: {len(ollama_response.response)}")
                print(f"First 100 chars: {ollama_response.response[:100]}")
            
        except Exception as e:
            print(f"\nError: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_context_analysis())