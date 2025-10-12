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

interface SecurityAlertEmailProps {
  user_email: string
  alert_type: 'new_device' | 'suspicious_activity' | 'password_changed' | 'account_locked'
  details: {
    timestamp: string
    location?: string
    ip_address?: string
    device_info?: string
    action_taken?: string
  }
}

export const SecurityAlertEmail = ({
  user_email,
  alert_type,
  details,
}: SecurityAlertEmailProps) => {
  const getAlertInfo = () => {
    switch (alert_type) {
      case 'new_device':
        return {
          title: '🔐 New Device Login Detected',
          message: 'A login was detected from a new device or location.',
          severity: 'medium'
        }
      case 'suspicious_activity':
        return {
          title: '⚠️ Suspicious Activity Alert',
          message: 'Unusual activity has been detected on your account.',
          severity: 'high'
        }
      case 'password_changed':
        return {
          title: '✅ Password Changed Successfully',
          message: 'Your account password has been updated.',
          severity: 'low'
        }
      case 'account_locked':
        return {
          title: '🚨 Account Temporarily Locked',
          message: 'Your account has been locked due to multiple failed login attempts.',
          severity: 'high'
        }
      default:
        return {
          title: '🔒 Security Notification',
          message: 'A security event has occurred on your account.',
          severity: 'medium'
        }
    }
  }

  const alertInfo = getAlertInfo()
  const severityColor = alertInfo.severity === 'high' ? '#dc2626' : alertInfo.severity === 'medium' ? '#d97706' : '#059669'

  return (
    <Html>
      <Head />
      <Preview>Security alert for your Yacht Excel account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logo}>⚓</div>
              <Heading style={companyName}>Yacht Excel</Heading>
            </div>
            <Text style={tagline}>Security Alert</Text>
          </Section>

          <Section style={content}>
            <Heading style={{ ...h1, color: severityColor }}>{alertInfo.title}</Heading>
            
            <Section style={{ ...alertSection, borderColor: severityColor }}>
              <Text style={{ ...alertText, color: severityColor }}>
                {alertInfo.message}
              </Text>
            </Section>

            <Text style={text}>
              Account: {user_email}
            </Text>

            <Section style={detailsSection}>
              <Text style={detailsTitle}>Event Details:</Text>
              <Text style={detailItem}>• Time: {details.timestamp}</Text>
              {details.location && <Text style={detailItem}>• Location: {details.location}</Text>}
              {details.ip_address && <Text style={detailItem}>• IP Address: {details.ip_address}</Text>}
              {details.device_info && <Text style={detailItem}>• Device: {details.device_info}</Text>}
              {details.action_taken && <Text style={detailItem}>• Action Taken: {details.action_taken}</Text>}
            </Section>

            {alert_type === 'new_device' && (
              <Section style={actionSection}>
                <Text style={text}>
                  If this was you, no action is needed. If you don't recognize this activity:
                </Text>
                <Link href="#" style={actionButton}>
                  Secure My Account
                </Link>
              </Section>
            )}

            {alert_type === 'account_locked' && (
              <Section style={actionSection}>
                <Text style={text}>
                  Your account will be automatically unlocked in 30 minutes, or you can:
                </Text>
                <Link href="#" style={actionButton}>
                  Reset Password Now
                </Link>
              </Section>
            )}

            <Section style={securitySection}>
              <Text style={securityTitle}>Recommended Security Actions:</Text>
              <Text style={securityItem}>• Review your recent account activity</Text>
              <Text style={securityItem}>• Enable two-factor authentication if not already active</Text>
              <Text style={securityItem}>• Use strong, unique passwords</Text>
              <Text style={securityItem}>• Keep your devices and browsers updated</Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated security notification. For immediate assistance, contact support@yachtexcel.com
            </Text>
            <Text style={footerCopyright}>
              © 2024 Yacht Excel. Advanced maritime security solutions.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SecurityAlertEmail

// Security-focused styling
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
  border: '2px solid #e5e7eb',
}

const header = {
  backgroundColor: '#1e293b',
  padding: '30px',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '5px',
}

const logo = {
  fontSize: '24px',
  marginRight: '8px',
  filter: 'brightness(0) invert(1)',
}

const companyName = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const tagline = {
  color: '#f59e0b',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '5px 0 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const content = {
  padding: '30px',
}

const h1 = {
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 15px 0',
}

const alertSection = {
  backgroundColor: '#fef3c7',
  border: '2px solid',
  borderRadius: '8px',
  padding: '15px',
  margin: '20px 0',
}

const alertText = {
  fontSize: '15px',
  fontWeight: 'bold',
  lineHeight: '22px',
  margin: '0',
}

const detailsSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const detailsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const detailItem = {
  color: '#475569',
  fontSize: '13px',
  margin: '5px 0',
  lineHeight: '18px',
  fontFamily: 'Monaco, Consolas, monospace',
}

const actionSection = {
  textAlign: 'center' as const,
  margin: '25px 0',
  padding: '20px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
}

const actionButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '10px 0',
}

const securitySection = {
  margin: '25px 0',
  padding: '20px',
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  border: '1px solid #bae6fd',
}

const securityTitle = {
  color: '#0c4a6e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const securityItem = {
  color: '#0369a1',
  fontSize: '13px',
  margin: '4px 0',
  lineHeight: '18px',
}

const footer = {
  borderTop: '2px solid #e5e7eb',
  padding: '25px 30px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
}

const footerText = {
  color: '#6b7280',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '0 0 10px 0',
}

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '10px',
  margin: '10px 0 0 0',
}