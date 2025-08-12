"""NER-based text segmentation methods for the Simple Learning Engine."""

import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def segment_text_with_ner(nlp, text: str) -> List[Dict[str, Any]]:
    """Extract individual words using NER, focusing on nouns and removing verbs/articles."""
    segments = []
    
    if not nlp:
        logger.warning("NLP model not available, falling back to basic segmentation")
        return basic_segment_text(text)
    
    # Process text with spaCy
    doc = nlp(text)
    
    # Extract words that are nouns or proper nouns, and skip articles/verbs
    for token in doc:
        # Skip tokens that are:
        # - Stop words (articles, prepositions, etc.)
        # - Punctuation
        # - Whitespace
        # - Verbs (unless they could be names in specific contexts)
        if (token.is_stop or token.is_punct or token.is_space or 
            token.pos_ in ['VERB', 'AUX', 'ADP', 'CONJ', 'CCONJ', 'SCONJ', 'DET', 'PART']):
            continue
        
        # Focus on nouns, proper nouns, and numbers that might be PII
        if token.pos_ in ['NOUN', 'PROPN', 'NUM'] or token.ent_type_:
            # Determine PII type based on NER label or token characteristics
            pii_type = determine_pii_type(token)
            
            if pii_type:
                segments.append({
                    'text': token.text,
                    'start': token.idx,
                    'end': token.idx + len(token.text),
                    'type': pii_type,
                    'pattern_matched': bool(token.ent_type_),  # True if NER detected it
                    'pos': token.pos_,
                    'ent_type': token.ent_type_ or 'NONE'
                })
    
    # Also extract multi-word entities identified by NER
    for ent in doc.ents:
        if is_pii_entity_type(ent.label_):
            # Check if this entity overlaps with existing segments
            overlap = any(
                ent.start_char < seg['end'] and ent.end_char > seg['start']
                for seg in segments
            )
            
            if not overlap:
                segments.append({
                    'text': ent.text,
                    'start': ent.start_char,
                    'end': ent.end_char,
                    'type': map_ner_label_to_pii_type(ent.label_),
                    'pattern_matched': True,  # High confidence from NER
                    'pos': 'ENTITY',
                    'ent_type': ent.label_
                })
    
    # Add pattern-based detection for specific PII formats
    pattern_segments = extract_pattern_based_segments(text)
    for seg in pattern_segments:
        # Check for overlaps with NER results
        overlap = any(
            seg['start'] < existing['end'] and seg['end'] > existing['start']
            for existing in segments
        )
        if not overlap:
            segments.append(seg)
    
    # Sort segments by start position
    segments.sort(key=lambda x: x['start'])
    
    return segments


def determine_pii_type(token) -> Optional[str]:
    """Determine if a token could be PII and what type."""
    # Check NER entity type first
    if token.ent_type_:
        return map_ner_label_to_pii_type(token.ent_type_)
    
    # Check token characteristics
    text = token.text.lower()
    
    # Proper nouns that could be names
    if token.pos_ == 'PROPN':
        # Filter out common non-name proper nouns
        if not any(word in text for word in ['monday', 'tuesday', 'wednesday', 'thursday', 
                                             'friday', 'saturday', 'sunday', 'january', 
                                             'february', 'march', 'april', 'may', 'june',
                                             'july', 'august', 'september', 'october', 
                                             'november', 'december']):
            return 'name'
    
    # Numbers that could be PII
    if token.pos_ == 'NUM' and len(token.text) >= 3:
        return 'number'  # Could be phone, SSN, etc.
    
    # Nouns that could be locations
    if (token.pos_ == 'NOUN' and 
        any(word in text for word in ['street', 'avenue', 'road', 'drive', 'lane', 
                                     'boulevard', 'place', 'court', 'way'])):
        return 'address'
    
    return None


def is_pii_entity_type(label: str) -> bool:
    """Check if NER entity type indicates PII."""
    pii_labels = {
        'PERSON', 'ORG', 'DATE', 'GPE', 'LOC', 'FAC', 'NORP', 
        'EVENT', 'PRODUCT', 'WORK_OF_ART', 'LAW', 'LANGUAGE'
    }
    return label in pii_labels


def map_ner_label_to_pii_type(label: str) -> str:
    """Map NER entity label to PII type."""
    mapping = {
        'PERSON': 'name',
        'ORG': 'organization',
        'DATE': 'date',
        'GPE': 'location',  # Geopolitical entity
        'LOC': 'location',
        'FAC': 'location',  # Facility
        'NORP': 'group',    # Nationalities, religious groups
        'EVENT': 'event',
        'PRODUCT': 'product',
        'WORK_OF_ART': 'title',
        'LAW': 'legal',
        'LANGUAGE': 'language'
    }
    return mapping.get(label, 'unknown')


def extract_pattern_based_segments(text: str) -> List[Dict[str, Any]]:
    """Extract PII using regex patterns for formats NER might miss."""
    segments = []
    
    # Define PII patterns with their types
    pii_patterns = [
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'email'),  # Email
        (r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b', 'phone'),  # Phone
        (r'\b\d{3}-\d{2}-\d{4}\b', 'ssn'),  # SSN
        (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', 'credit_card'),  # Credit Card
        (r'\b\d{5}(?:-\d{4})?\b', 'postal_code'),  # ZIP codes
    ]
    
    for pattern, pii_type in pii_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            segments.append({
                'text': match.group().strip(),
                'start': match.start(),
                'end': match.end(),
                'type': pii_type,
                'pattern_matched': True,
                'pos': 'PATTERN',
                'ent_type': 'PATTERN'
            })
    
    return segments


def basic_segment_text(text: str) -> List[Dict[str, Any]]:
    """Fallback basic segmentation when NER is not available."""
    segments = []
    words = text.split()
    start_pos = 0
    
    for word in words:
        # Find the actual position in text
        word_start = text.find(word, start_pos)
        word_end = word_start + len(word)
        
        # Basic check if word could be PII (capitalized, contains digits, etc.)
        if (word[0].isupper() or any(c.isdigit() for c in word) or '@' in word):
            segments.append({
                'text': word,
                'start': word_start,
                'end': word_end,
                'type': 'unknown',
                'pattern_matched': False,
                'pos': 'UNKNOWN',
                'ent_type': 'NONE'
            })
        
        start_pos = word_end
    
    return segments