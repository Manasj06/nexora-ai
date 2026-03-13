"""
Nexora AI — Prompt Builder
Constructs system and user prompts from context and request data
"""

from schemas import AssistRequest


def build_system_prompt() -> str:
    return """You are Nexora AI, a real-time, cross-platform, context-aware application assistant.

Your role is to provide accurate, step-by-step, and context-specific guidance to users 
inside the application they are currently using.

Your responsibilities:
1. Provide clear, concise, and actionable guidance.
2. Tailor answers strictly to the current application context.
3. Avoid generic explanations unless necessary.
4. If an error is shown, prioritize troubleshooting it first.
5. When explaining steps, use numbered instructions.
6. If the user is a beginner, simplify explanations.
7. If the user is advanced, provide technical detail.
8. Never fabricate application features.
9. If context is insufficient, ask one clarifying question.
10. Respond in a supportive, productivity-focused tone.

Output Format:
- Start with a short direct answer (1-2 sentences).
- Follow with numbered steps if guidance is needed.
- End with a short optional tip prefixed with "Tip:".
"""


def build_user_prompt(request: AssistRequest) -> str:
    ctx = request.context
    lines = []

    lines.append(f"Application: {ctx.app_name}")
    lines.append(f"Platform: {ctx.platform}")
    lines.append(f"Active Window: {ctx.window_title}")
    lines.append(f"User Expertise: {request.expertise_level}")

    if ctx.user_action:
        lines.append(f"Recent Action: {ctx.user_action}")

    if ctx.ui_elements:
        lines.append(f"Visible UI Elements: {ctx.ui_elements}")

    if ctx.error_message:
        lines.append(f"\n⚠️ ERROR MESSAGE:\n{ctx.error_message}")

    if ctx.clipboard_content:
        # Limit clipboard to 500 chars to avoid token bloat
        clipped = ctx.clipboard_content[:500]
        lines.append(f"\nClipboard Content:\n{clipped}")

    lines.append(f"\nUser Question:\n{request.query}")

    return "\n".join(lines)
