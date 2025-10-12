import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const PasswordResetEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Yacht Excel password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logoContainer}>
            <div style={logo}>⚓</div>
            <Heading style={companyName}>Yacht Excel</Heading>
          </div>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Password Reset Request</Heading>
          <Text style={text}>
            We received a request to reset the password for your Yacht Excel account ({user_email}).
          </Text>

          <Section style={alertSection}>
            <Text style={alertText}>
              🔒 Security Notice: If you didn't request this password reset, please ignore this email. 
              Your account remains secure.
            </Text>
          </Section>

          <Section style={resetSection}>
            <Text style={text}>
              To create a new password, click the button below:
            </Text>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
              target="_blank"
              style={resetButton}
            >
              Reset Password
            </Link>
          </Section>

          <Section style={alternativeSection}>
            <Text style={smallText}>
              Or copy and paste this reset code in the app:
            </Text>
            <code style={code}>{token}</code>
          </Section>

          <Section style={securitySection}>
            <Text style={securityTitle}>Security Best Practices:</Text>
            <Text style={securityItem}>• Use a strong, unique password</Text>
            <Text style={securityItem}>• Include uppercase, lowercase, numbers, and symbols</Text>
            <Text style={securityItem}>• Don't reuse passwords from other accounts</Text>
            <Text style={securityItem}>• Consider enabling two-factor authentication</Text>
          </Section>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            This password reset link will expire in 1 hour for security.
          </Text>
          <Text style={footerText}>
            For assistance, contact: support@yachtexcel.com
          </Text>
          <Text style={footerCopyright}>
            © 2024 Yacht Excel. Secure yacht management solutions.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

// Yacht-themed styling with security focus
const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
}

const header = {
  backgroundColor: '#dc2626',
  padding: '30px',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const logo = {
  fontSize: '28px',
  marginRight: '10px',
  filter: 'brightness(0) invert(1)',
}

const companyName = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '40px 30px',
}

const h1 = {
  color: '#dc2626',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const alertSection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '15px',
  margin: '20px 0',
}

const alertText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const resetSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const resetButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '10px 0',
}

const alternativeSection = {
  textAlign: 'center' as const,
  margin: '20px 0',
  padding: '20px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 10px 0',
}

const code = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  fontFamily: 'Monaco, Consolas, monospace',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 12px',
  borderRadius: '4px',
  letterSpacing: '1px',
}

const securitySection = {
  margin: '30px 0',
  padding: '20px',
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  border: '1px solid #bae6fd',
}

const securityTitle = {
  color: '#0c4a6e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
}

const securityItem = {
  color: '#0369a1',
  fontSize: '14px',
  margin: '5px 0',
  lineHeight: '20px',
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  padding: '30px 30px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 10px 0',
}

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '15px 0 0 0',
}