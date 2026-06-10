import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Hazards from '@/pages/Hazards'
import Inspections from '@/pages/Inspections'
import Drills from '@/pages/Drills'
import Archives from '@/pages/Archives'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/hazards" element={<Hazards />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/archives" element={<Archives />} />
        </Route>
      </Routes>
    </Router>
  )
}
