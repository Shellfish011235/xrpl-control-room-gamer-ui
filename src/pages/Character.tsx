import { motion } from 'framer-motion'
import { 
  User, Star, Trophy, Zap, Github, Twitter, Globe, 
  ChevronRight, Code, GitBranch, Award, Users,
  Calendar, MessageSquare, Heart, ExternalLink
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { ProfilePictureUpload } from '../components/ProfilePictureUpload'
import { useProfileStore } from '../store/profileStore'

const achievements = [
  { id: 1, name: 'Early Adopter', icon: Star, unlocked: true, color: 'cyber-yellow' },
  { id: 2, name: 'Code Contributor', icon: Code, unlocked: true, color: 'cyber-glow' },
  { id: 3, name: 'Community Leader', icon: Users, unlocked: true, color: 'cyber-purple' },
  { id: 4, name: 'Validator Champion', icon: Trophy, unlocked: false, color: 'cyber-muted' },
  { id: 5, name: 'DEX Master', icon: Zap, unlocked: false, color: 'cyber-muted' },
  { id: 6, name: 'Governance Guru', icon: Award, unlocked: false, color: 'cyber-muted' },
]

const contributors = [
  {
    name: 'David Schwartz',
    role: 'CTO, Ripple',
    avatar: 'DS',
    commits: 2847,
    repos: 12,
    followers: '125K',
    color: 'cyber-glow'
  },
  {
    name: 'Wietse Wind',
    role: 'Founder, XRPL Labs',
    avatar: 'WW',
    commits: 1923,
    repos: 45,
    followers: '89K',
    color: 'cyber-purple'
  },
  {
    name: 'Nik Bougalis',
    role: 'Senior Staff Engineer',
    avatar: 'NB',
    commits: 1654,
    repos: 8,
    followers: '45K',
    color: 'cyber-cyan'
  },
  {
    name: 'Scott Chamberlain',
    role: 'Developer Advocate',
    avatar: 'SC',
    commits: 892,
    repos: 23,
    followers: '32K',
    color: 'cyber-green'
  },
  {
    name: 'Denis Angell',
    role: 'Core Developer',
    avatar: 'DA',
    commits: 756,
    repos: 15,
    followers: '18K',
    color: 'cyber-yellow'
  },
  {
    name: 'Richard Holland',
    role: 'Hooks Developer',
    avatar: 'RH',
    commits: 634,
    repos: 11,
    followers: '28K',
    color: 'cyber-orange'
  },
]

const activityData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  commits: Math.floor(Math.random() * 15) + 2,
  prs: Math.floor(Math.random() * 5)
}))

const communityEvents = [
  { date: 'Jan 25', title: 'XRPL Developer Summit', type: 'conference' },
  { date: 'Feb 10', title: 'Hooks Hackathon', type: 'hackathon' },
  { date: 'Feb 20', title: 'Community AMA', type: 'ama' },
  { date: 'Mar 5', title: 'Validator Workshop', type: 'workshop' },
]

export default function Character() {
  const { username, reputation, socialScore, skillPoints, level, xp } = useProfileStore()
  const nextLevel = 10000

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="text-cyber-cyan" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">CHARACTER</h1>
          </div>
          <p className="text-cyber-muted">Digital Profile & Community Hub</p>
        </motion.div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cyber-panel p-4 cyber-glow">
              {/* Profile Header */}
              <div className="text-center mb-4">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {/* Profile Picture with Upload */}
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-cyber-glow via-cyber-purple to-cyber-cyan p-1">
                    <ProfilePictureUpload size="md" className="!w-full !h-full !max-w-none !rounded-full" />
                  </div>
                  {/* Level Badge */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyber-purple flex items-center justify-center border-2 border-cyber-darker">
                    <span className="font-cyber text-xs text-white">{level}</span>
                  </div>
                </div>
                
                <h2 className="font-cyber text-lg text-cyber-text">{username}</h2>
                <p className="text-xs text-cyber-muted">Member since 2024</p>
              </div>
              
              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-cyber-muted">Level {level}</span>
                  <span className="text-cyber-glow">{xp.toLocaleString()} / {nextLevel.toLocaleString()} XP</span>
                </div>
                <div className="cyber-progress h-2">
                  <motion.div 
                    className="cyber-progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / nextLevel) * 100}%` }}
                    transition={{ delay: 0.3, duration: 1 }}
                  />
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Reputation', value: reputation, icon: Star, color: 'cyber-yellow' },
                  { label: 'Social Score', value: socialScore, icon: Heart, color: 'cyber-red' },
                  { label: 'Skill Points', value: skillPoints, icon: Zap, color: 'cyber-glow' },
                  { label: 'Rank', value: '#247', icon: Trophy, color: 'cyber-purple' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                    <stat.icon size={16} className={`text-${stat.color} mx-auto mb-1`} />
                    <p className="font-cyber text-lg text-cyber-text">{stat.value}</p>
                    <p className="text-xs text-cyber-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {/* Social Links */}
              <div className="flex items-center justify-center gap-3">
                {[
                  { icon: Github, color: 'text-cyber-text hover:text-cyber-glow' },
                  { icon: Twitter, color: 'text-cyber-text hover:text-cyber-blue' },
                  { icon: Globe, color: 'text-cyber-text hover:text-cyber-purple' },
                ].map((link, idx) => (
                  <button key={idx} className={`p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 transition-colors ${link.color}`}>
                    <link.icon size={18} />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Achievements */}
            <div className="cyber-panel p-4 mt-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Award size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-sm text-cyber-yellow">ACHIEVEMENTS</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${
                        achievement.unlocked 
                          ? `border-${achievement.color}/50 bg-${achievement.color}/10 hover:border-${achievement.color}` 
                          : 'border-cyber-border bg-cyber-darker/50 opacity-50'
                      }`}
                    >
                      <Icon size={20} className={achievement.unlocked ? `text-${achievement.color}` : 'text-cyber-muted'} />
                      <span className="text-[10px] text-center text-cyber-muted mt-1">{achievement.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
          
          {/* Center Column - Contributors Grid */}
          <motion.div 
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-cyber-purple" />
                  <span className="font-cyber text-sm text-cyber-purple">TOP CONTRIBUTORS</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs rounded bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/30">All Time</button>
                  <button className="px-3 py-1 text-xs rounded bg-cyber-darker text-cyber-muted border border-cyber-border hover:border-cyber-glow/30">This Month</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contributors.map((contributor, idx) => (
                  <motion.div
                    key={contributor.name}
                    className={`p-4 rounded-lg bg-cyber-darker/50 border border-cyber-border/50 hover:border-${contributor.color}/50 transition-all cursor-pointer group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${contributor.color}/30 to-${contributor.color}/10 border border-${contributor.color}/50 flex items-center justify-center shrink-0`}>
                        <span className={`font-cyber text-sm text-${contributor.color}`}>{contributor.avatar}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-cyber text-sm text-cyber-text truncate">{contributor.name}</h3>
                          <ExternalLink size={12} className="text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="text-xs text-cyber-muted mb-2">{contributor.role}</p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <GitBranch size={12} className="text-cyber-green" />
                            <span className="text-xs text-cyber-text">{contributor.commits}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Code size={12} className="text-cyber-purple" />
                            <span className="text-xs text-cyber-text">{contributor.repos}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-cyber-glow" />
                            <span className="text-xs text-cyber-text">{contributor.followers}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Activity Chart */}
              <div className="mt-6 pt-4 border-t border-cyber-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-cyber text-sm text-cyber-glow">COMMUNITY ACTIVITY</span>
                  <span className="text-xs text-cyber-muted">Last 30 days</span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="commits" 
                        stroke="#a855f7" 
                        fill="url(#activityGradient)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Events & Resources */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Upcoming Events */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Calendar size={16} className="text-cyber-green" />
                <span className="font-cyber text-sm text-cyber-green">UPCOMING EVENTS</span>
              </div>
              
              <div className="space-y-3">
                {communityEvents.map((event, idx) => {
                  const typeColors = {
                    conference: 'border-cyber-glow/50 text-cyber-glow',
                    hackathon: 'border-cyber-purple/50 text-cyber-purple',
                    ama: 'border-cyber-yellow/50 text-cyber-yellow',
                    workshop: 'border-cyber-green/50 text-cyber-green'
                  }
                  
                  return (
                    <motion.div
                      key={event.title}
                      className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-cyber-muted">{event.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[event.type as keyof typeof typeColors]}`}>
                          {event.type}
                        </span>
                      </div>
                      <p className="text-sm text-cyber-text">{event.title}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            
            {/* Community Links */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <MessageSquare size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan">COMMUNITY</span>
              </div>
              
              <div className="space-y-2">
                {[
                  { name: 'r/XRP', icon: MessageSquare, members: '1.2M', color: 'cyber-orange' },
                  { name: 'Discord', icon: Users, members: '85K', color: 'cyber-purple' },
                  { name: 'XRPL Commons', icon: Globe, members: '12K', color: 'cyber-green' },
                  { name: 'Dev Forum', icon: Code, members: '8K', color: 'cyber-glow' },
                ].map((community) => (
                  <button
                    key={community.name}
                    className="w-full flex items-center gap-3 p-3 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/30 transition-all group"
                  >
                    <community.icon size={16} className={`text-${community.color}`} />
                    <span className="text-sm text-cyber-text flex-1 text-left">{community.name}</span>
                    <span className="text-xs text-cyber-muted">{community.members}</span>
                    <ChevronRight size={14} className="text-cyber-muted group-hover:text-cyber-glow transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Milestones */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Trophy size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-sm text-cyber-yellow">MILESTONES</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: '10 Years of XRPL', progress: 100 },
                  { label: '100M Accounts', progress: 87 },
                  { label: '1B Transactions', progress: 92 },
                ].map((milestone) => (
                  <div key={milestone.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cyber-text">{milestone.label}</span>
                      <span className="text-cyber-yellow">{milestone.progress}%</span>
                    </div>
                    <div className="cyber-progress h-1.5">
                      <div 
                        className="cyber-progress-bar bg-cyber-yellow"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
