import chess

DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

def validate_fen(fen: str) -> str:
    """
    Validates a chess FEN string. Returns the cleaned FEN if valid,
    or the default starting position FEN if invalid.
    """
    if not fen or not isinstance(fen, str):
        return DEFAULT_FEN
    
    cleaned = fen.strip()
    if cleaned in ["", "start", "null", "undefined"]:
        return DEFAULT_FEN
    
    try:
        chess.Board(cleaned)
        return cleaned
    except Exception:
        return DEFAULT_FEN
