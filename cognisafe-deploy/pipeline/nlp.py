import spacy
import subprocess
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

def load_spacy_model():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        print("[NLP] Downloading spaCy model...")
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        return spacy.load("en_core_web_sm")

print("[NLP] Loading spaCy model...")
NLP = load_spacy_model()
print("[NLP] spaCy loaded ✅")

print("[NLP] Loading sentence transformer...")
EMBEDDER = SentenceTransformer("all-MiniLM-L6-v2")
print("[NLP] Sentence transformer loaded ✅")


def analyze_text(transcript_data: dict) -> dict:
    """
    Analyze transcript text and return 4 NLP biomarkers:
    - lexical_diversity     (MTLD score)
    - semantic_coherence    (cosine similarity between sentences)
    - idea_density          (propositions / total words)
    - syntactic_complexity  (average parse tree depth)
    """

    text = transcript_data.get('text', '')

    # Handle edge case — empty or very short transcript
    if not text or len(text.split()) < 10:
        print("[NLP WARNING] Transcript too short, returning defaults")
        return _fallback_nlp()

    try:
        doc = NLP(text)

        lexical_diversity    = compute_mtld(doc)
        semantic_coherence   = compute_semantic_coherence(text)
        idea_density         = compute_idea_density(doc)
        syntactic_complexity = compute_syntactic_complexity(doc)

        result = {
            'lexical_diversity':    round(lexical_diversity, 4),
            'semantic_coherence':   round(semantic_coherence, 4),
            'idea_density':         round(idea_density, 4),
            'syntactic_complexity': round(syntactic_complexity, 4),
        }

        print(f"[NLP] Analysis complete: {result}")
        return result

    except Exception as e:
        print(f"[NLP ERROR] {e}")
        return _fallback_nlp()


# ── MTLD — Measure of Textual Lexical Diversity ──────────────────────────────
def compute_mtld(doc) -> float:
    """
    MTLD measures vocabulary richness.
    Higher = more diverse vocabulary (healthier).
    Typical range: 40-100+
    """
    tokens = [token.text.lower() for token in doc
              if token.is_alpha and not token.is_stop]

    if len(tokens) < 10:
        return 0.0

    def mtld_pass(tokens, threshold=0.72):
        factor_count = 0
        token_count  = 0
        types        = set()

        for token in tokens:
            token_count += 1
            types.add(token)
            ttr = len(types) / token_count

            if ttr <= threshold:
                factor_count += 1
                token_count   = 0
                types         = set()

        # partial factor at the end
        if token_count > 0:
            ttr = len(types) / token_count
            factor_count += (1 - ttr) / (1 - threshold)

        return len(tokens) / factor_count if factor_count > 0 else len(tokens)

    # MTLD is average of forward and backward passes
    forward  = mtld_pass(tokens)
    backward = mtld_pass(list(reversed(tokens)))
    return (forward + backward) / 2


# ── Semantic Coherence ────────────────────────────────────────────────────────
def compute_semantic_coherence(text: str) -> float:
    """
    Measures how logically connected sentences are.
    Higher = more coherent speech (healthier).
    Range: 0.0 to 1.0
    """
    # Split into sentences using spaCy
    doc       = NLP(text)
    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 5]

    if len(sentences) < 2:
        return 1.0  # only one sentence — assume coherent

    # Get sentence embeddings
    embeddings = EMBEDDER.encode(sentences)

    # Compute cosine similarity between consecutive sentences
    similarities = []
    for i in range(1, len(embeddings)):
        sim = cosine_similarity(
            embeddings[i - 1].reshape(1, -1),
            embeddings[i].reshape(1, -1)
        )[0][0]
        similarities.append(sim)

    return float(np.mean(similarities))


# ── Idea Density ──────────────────────────────────────────────────────────────
def compute_idea_density(doc) -> float:
    """
    Propositions per word — measures information richness.
    Higher = more ideas expressed per word (healthier).
    Typical range: 0.3 - 0.6
    """
    total_words = len([token for token in doc if token.is_alpha])

    if total_words == 0:
        return 0.0

    # Propositions = verbs + adjectives + adverbs + prepositions
    proposition_pos = {'VERB', 'ADJ', 'ADV', 'ADP'}
    proposition_count = len([
        token for token in doc
        if token.pos_ in proposition_pos and token.is_alpha
    ])

    return proposition_count / total_words


# ── Syntactic Complexity ──────────────────────────────────────────────────────
def compute_syntactic_complexity(doc) -> float:
    """
    Average parse tree depth — measures sentence complexity.
    Higher = more complex sentence structures.
    Typical range: 2 - 8
    """
    depths = []

    for sent in doc.sents:
        # Find the root of this sentence
        root = [token for token in sent if token.dep_ == 'ROOT']
        if not root:
            continue

        # BFS to find max depth of the dependency tree
        def get_depth(token, current_depth=0):
            children = list(token.children)
            if not children:
                return current_depth
            return max(get_depth(child, current_depth + 1) for child in children)

        depth = get_depth(root[0])
        depths.append(depth)

    return float(np.mean(depths)) if depths else 0.0


# ── Fallback ──────────────────────────────────────────────────────────────────
def _fallback_nlp() -> dict:
    return {
        'lexical_diversity':    0.0,
        'semantic_coherence':   0.0,
        'idea_density':         0.0,
        'syntactic_complexity': 0.0,
    }