import { Metadata } from "next"
import { SignUpForm } from "./sign-up-form"

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your account',
}

export default function SignUpPage() {
  return <SignUpForm />
}