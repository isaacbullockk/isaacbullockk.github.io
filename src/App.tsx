import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Copilot from '@/pages/Copilot'
import Library from '@/pages/Library'
import Playbook from '@/pages/Playbook'
import Science from '@/pages/Science'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="copilot" element={<Copilot />} />
        <Route path="library" element={<Library />} />
        <Route path="playbook" element={<Playbook />} />
        <Route path="science" element={<Science />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
