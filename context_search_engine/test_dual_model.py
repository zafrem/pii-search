import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.engine import ContextSearchEngine
from src.models import ContextSearchRequest, AnalysisMode

async def test_dual_model():
    engine = ContextSearchEngine()
    await engine.initialize()
    
    # Test with a clear PII example
    test_text = 'Please contact John Smith at john.smith@company.com or call 555-123-4567 for more information.'
    
    request = ContextSearchRequest(
        text=test_text,
        languages=['english'],
        analysis_mode=AnalysisMode.STANDARD,
        confidence_threshold=0.5
    )
    
    print('Testing dual-model analysis with clear PII example...')
    result = await engine.search(request)
    
    print(f'Stage: {result.stage}')
    print(f'Method: {result.method}')
    print(f'Processing time: {result.processing_time:.3f}s')
    print(f'Total items found: {len(result.items)}')
    
    for item in result.items:
        print(f'\nEntity: {item.text} ({item.type})')
        print(f'Position: {item.position.start}-{item.position.end}')
        print(f'Original confidence: {item.original_probability:.3f}')
        print(f'Refined confidence: {item.refined_probability:.3f}')
        print(f'Risk level: {item.analysis_result.risk_level}')
        print(f'Validated: {item.is_validated}')
        print(f'Reason: {item.analysis_result.reason}')
        if item.analysis_result.false_positive_indicators:
            print(f'False positive indicators: {item.analysis_result.false_positive_indicators}')
    
    # Print summary
    summary = result.generate_summary()
    print(f'\nSummary:')
    print(f'- Total validated items: {summary["totalItems"]}')
    print(f'- False positives filtered: {summary["falsePositivesFiltered"]}')
    print(f'- High risk items: {summary["highRiskItems"]}')
    print(f'- Average confidence: {summary["averageConfidence"]}')

if __name__ == "__main__":
    asyncio.run(test_dual_model())