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
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeVerificationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const WelcomeVerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: WelcomeVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Yacht Excel - Verify your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logoContainer}>
            <div style={logo}>⚓</div>
            <Heading style={companyName}>Yacht Excel</Heading>
          </div>
          <Text style={tagline}>Excel-powered yacht management platform</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Welcome Aboard!</Heading>
          <Text style={text}>
            Thank you for joining Yacht Excel, the premier platform for yacht management. 
            You're one step away from accessing powerful tools designed specifically for maritime professionals.
          </Text>

          <Section style={verificationSection}>
            <Text style={text}>
              To activate your account and ensure security, please verify your email address:
            </Text>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
              target="_blank"
              style={verifyButton}
            >
              Verify Email Address
            </Link>
          </Section>

          <Section style={alternativeSection}>
            <Text style={smallText}>
              Or copy and paste this verification code in the app:
            </Text>
            <code style={code}>{token}</code>
          </Section>

          <Section style={featuresSection}>
            <Text style={featuresTitle}>What's waiting for you:</Text>
            <Text style={featureItem}>🚢 Fleet Management & Tracking</Text>
            <Text style={featureItem}>📊 Advanced Analytics & Reporting</Text>
            <Text style={featureItem}>🛡️ Enterprise-grade Security</Text>
            <Text style={featureItem}>⚙️ Maintenance Scheduling</Text>
          </Section>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            This verification link will expire in 24 hours for security reasons.
          </Text>
          <Text style={footerText}>
            If you didn't create this account, please ignore this email.
          </Text>
          <Text style={footerCopyright}>
            © 2024 Yacht Excel. Professional yacht management solutions.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeVerificationEmail

// Yacht-themed styling
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
}

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '10px',
}

const logo = {
  fontSize: '32px',
  marginRight: '10px',
}

const companyName = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
}

const tagline = {
  color: '#e0e7ff',
  fontSize: '14px',
  margin: '5px 0 0 0',
}

const content = {
  padding: '40px 30px',
}

const h1 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const verificationSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const verifyButton = {
  backgroundColor: '#3b82f6',
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
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
}

const smallText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 10px 0',
}

const code = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  fontFamily: 'Monaco, Consolas, monospace',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '10px 15px',
  borderRadius: '4px',
  letterSpacing: '2px',
}

const featuresSection = {
  margin: '30px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
}

const featuresTitle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
}

const featureItem = {
  color: '#475569',
  fontSize: '14px',
  margin: '5px 0',
  lineHeight: '20px',
}

const footer = {
  borderTop: '1px solid #e2e8f0',
  padding: '30px 30px 20px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 10px 0',
}

const footerCopyright = {
  color: '#94a3b8',
  fontSize: '11px',
  margin: '15px 0 0 0',
}