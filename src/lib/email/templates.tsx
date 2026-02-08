import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "32px" }}>
            {children}
          </Section>
          <Text style={{ color: "#6b7280", fontSize: "12px", textAlign: "center" as const, marginTop: "16px" }}>
            Academic Journal Platform
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function SubmissionReceivedEmail({ title }: { title: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Submission Received</Text>
      <Text>Your manuscript &quot;{title}&quot; has been successfully submitted and is now under editorial review.</Text>
      <Link href={`${baseUrl}/dashboard/submissions`} style={{ color: "#2563eb" }}>
        View your submissions
      </Link>
    </Layout>
  );
}

export function ReviewerAssignedEmail({ title, deadline }: { title: string; deadline: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>New Review Assignment</Text>
      <Text>You have been assigned to review a manuscript: &quot;{title}&quot;</Text>
      <Text>Deadline: {new Date(deadline).toLocaleDateString()}</Text>
      <Link href={`${baseUrl}/dashboard/reviews`} style={{ color: "#2563eb" }}>
        View your reviews
      </Link>
    </Layout>
  );
}

export function ReviewSubmittedEmail({ title, reviewerName }: { title: string; reviewerName: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Review Submitted</Text>
      <Text>A review has been submitted for &quot;{title}&quot; by {reviewerName}.</Text>
      <Link href={`${baseUrl}/dashboard/editor`} style={{ color: "#2563eb" }}>
        View in editor panel
      </Link>
    </Layout>
  );
}

export function DecisionMadeEmail({ title, decision, notes }: { title: string; decision: string; notes?: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Decision on Your Submission</Text>
      <Text>A decision has been made on your manuscript &quot;{title}&quot;:</Text>
      <Text style={{ fontSize: "18px", fontWeight: "bold", textTransform: "capitalize" as const }}>{decision}</Text>
      {notes && <Text style={{ color: "#4b5563" }}>{notes}</Text>}
      <Link href={`${baseUrl}/dashboard/submissions`} style={{ color: "#2563eb" }}>
        View your submissions
      </Link>
    </Layout>
  );
}

export function PaperPublishedEmail({ title, doi }: { title: string; doi: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Paper Published</Text>
      <Text>Your paper &quot;{title}&quot; has been published!</Text>
      <Text>DOI: {doi}</Text>
      <Link href={`${baseUrl}/archive`} style={{ color: "#2563eb" }}>
        View in archive
      </Link>
    </Layout>
  );
}

export function SubmissionWithdrawnEmail({ title }: { title: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Submission Withdrawn</Text>
      <Text>The submission &quot;{title}&quot; has been withdrawn by the author.</Text>
    </Layout>
  );
}

export function ReviewReminderEmail({ title, deadline }: { title: string; deadline: string }) {
  return (
    <Layout>
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}>Review Reminder</Text>
      <Text>This is a reminder that your review for &quot;{title}&quot; is due on {new Date(deadline).toLocaleDateString()}.</Text>
      <Link href={`${baseUrl}/dashboard/reviews`} style={{ color: "#2563eb" }}>
        Submit your review
      </Link>
    </Layout>
  );
}
