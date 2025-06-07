import { redirect } from 'react-router'

export function loader() {
  // Redirect root path to /home
  return redirect('/home')
}
