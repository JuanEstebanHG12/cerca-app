import { Stack } from 'expo-router';

// The root layout already decides *whether* this group is reachable (Stack.Protected with
// status === 'signedIn'). This layout only owns how screens *inside* the group look.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
