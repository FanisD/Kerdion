import resend

from app.core.config import settings

# Configure the Resend SDK with the API key from settings
resend.api_key = settings.RESEND_API_KEY


async def send_verification_email(email: str, token: str, first_name: str) -> None:
    """Send a styled HTML verification email using Resend."""
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#0f1117; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1117; padding:40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="520" cellpadding="0" cellspacing="0"
                           style="background:linear-gradient(145deg,#1a1d2e,#13151f);
                                  border:1px solid rgba(255,255,255,0.08);
                                  border-radius:16px;
                                  padding:48px 40px;">
                        <tr>
                            <td align="center" style="padding-bottom:32px;">
                                <h1 style="margin:0; font-size:28px; font-weight:700;
                                           background:linear-gradient(135deg,#60a5fa,#a78bfa);
                                           -webkit-background-clip:text;
                                           -webkit-text-fill-color:transparent;">
                                    Kerdion
                                </h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="color:#e2e8f0; font-size:16px; line-height:1.6;">
                                <p style="margin:0 0 16px;">Hey {first_name},</p>
                                <p style="margin:0 0 24px;">
                                    Welcome to <strong>Kerdion</strong>! Please verify your email address
                                    to activate your account and get started.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-bottom:28px;">
                                <a href="{verification_link}"
                                   style="display:inline-block; padding:14px 36px;
                                          background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                                          color:#ffffff; font-size:15px; font-weight:600;
                                          text-decoration:none; border-radius:10px;">
                                    Verify Email Address
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="color:#94a3b8; font-size:13px; line-height:1.5;">
                                <p style="margin:0 0 8px;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin:0 0 24px; word-break:break-all;">
                                    <a href="{verification_link}"
                                       style="color:#60a5fa; text-decoration:underline;">
                                        {verification_link}
                                    </a>
                                </p>
                                <p style="margin:0; color:#64748b; font-size:12px;">
                                    If you didn't create a Kerdion account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    resend.Emails.send(
        {
            "from": "Kerdion <noreply@kerdion.com>",
            "to": [email],
            "subject": "Verify your Kerdion account",
            "html": html_body,
        }
    )
