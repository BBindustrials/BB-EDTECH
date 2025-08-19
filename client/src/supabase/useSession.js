import {useState, useEffect} from 'react'
import supabase from '../services/supabaseClient'

export function useSession() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const currentSession = supabase.auth.getSession()
    currentSession.then(({data}) => {
      setSession(data.session)
    })

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  return session
}
