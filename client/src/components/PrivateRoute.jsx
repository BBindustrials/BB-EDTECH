import {Navigate} from 'react-router-dom'
import {useSession} from '../supabase/useSession' // <-- Update this path based on your hook

const PrivateRoute = ({children}) => {
  const session = useSession()

  if (!session) return <Navigate to="/login" replace />
  return children
}

export default PrivateRoute
