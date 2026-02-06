import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_DISCUSSIONS, formatTimeAgo } from '@/data/mockData';
import {
  Hash,
  Users,
  Search,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['All', 'Computer Science', 'Physics', 'Mathematics', 'Biology', 'Engineering', 'General'];

export default function Discussions() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = MOCK_DISCUSSIONS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Discussions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join course-based rooms and connect with classmates
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-semibold text-success">{MOCK_DISCUSSIONS.filter(d => d.isActive).length} Active</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search discussions..."
          className="pl-9 h-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discussion List */}
      <div className="space-y-3">
        {filtered.map((discussion, i) => (
          <motion.div
            key={discussion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center gap-4 rounded-xl bg-card shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-all"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              discussion.isActive ? 'gradient-primary' : 'bg-muted'
            }`}>
              <Hash className={`h-5 w-5 ${discussion.isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-card-foreground truncate">
                  {discussion.name}
                </h3>
                {discussion.isActive && (
                  <span className="h-2 w-2 rounded-full bg-online animate-pulse-dot shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {discussion.lastMessage}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground">{discussion.memberCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground">{formatTimeAgo(discussion.lastMessageTime)}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {discussion.category}
                </Badge>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No discussions found</p>
          </div>
        )}
      </div>
    </div>
  );
}