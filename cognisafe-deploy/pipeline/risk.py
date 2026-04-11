def merge_biomarkers(acoustic: dict, nlp: dict) -> dict:
    """
    Merge acoustic and NLP biomarkers into one clean 14-biomarker dict.
    This is the standard output format for the entire pipeline.
    """
    return {
        # ── Acoustic (10) ──
        'speech_rate':         acoustic.get('speech_rate', 0.0),
        'articulation_rate':   acoustic.get('articulation_rate', 0.0),
        'pause_frequency':     acoustic.get('pause_frequency', 0.0),
        'pause_duration_mean': acoustic.get('pause_duration_mean', 0.0),
        'filled_pause_rate':   acoustic.get('filled_pause_rate', 0.0),
        'pitch_mean':          acoustic.get('pitch_mean', 0.0),
        'pitch_range':         acoustic.get('pitch_range', 0.0),
        'jitter':              acoustic.get('jitter', 0.0),
        'shimmer':             acoustic.get('shimmer', 0.0),
        'HNR':                 acoustic.get('HNR', 0.0),
        # ── NLP (4) ──
        'lexical_diversity':    nlp.get('lexical_diversity', 0.0),
        'semantic_coherence':   nlp.get('semantic_coherence', 0.0),
        'idea_density':         nlp.get('idea_density', 0.0),
        'syntactic_complexity': nlp.get('syntactic_complexity', 0.0),
    }