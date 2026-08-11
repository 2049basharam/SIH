from typing import Tuple

def determine_team_confidence(members_count: int, skills_listed: bool) -> Tuple[str, float, str]:
    """Calculates confidence values for team composition insights."""
    if members_count < 3:
        return "LOW", 0.35, "Insufficient team members registered to assess composition."
    if not skills_listed:
        return "MEDIUM", 0.65, "Team skill profile is incomplete."
    return "HIGH", 0.95, "Profile matches all validation metrics."

def determine_matching_confidence(idea: str) -> Tuple[str, float, str]:
    """Calculates confidence values for problem statement matches."""
    idea_len = len(idea.strip()) if idea else 0
    if idea_len < 15:
        return "LOW", 0.25, "Student input description is too brief to draw accurate matches."
    if idea_len < 50:
        return "MEDIUM", 0.70, "Match is based on limited keyword descriptions."
    return "HIGH", 0.95, "Detail-rich description provided for semantic vector comparisons."
