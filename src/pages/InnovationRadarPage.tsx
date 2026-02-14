import { motion } from 'framer-motion'
import InnovationRadar from '../components/InnovationRadar'

export default function InnovationRadarPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-8 flex flex-col items-center min-h-[60vh]"
    >
      <InnovationRadar />
    </motion.div>
  )
}
