import "./globals.css";

export const metadata: Metadata = {
  title: "AssignmentOS · Academic Writing & Assistance",
  description: "A student-centered academic workspace for assignment planning, writing, and course-material research."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
