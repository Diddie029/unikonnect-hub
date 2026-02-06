export interface Post {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userUniversity?: string;
  content: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface Discussion {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  lastMessage: string;
  lastMessageTime: Date;
  isActive: boolean;
}

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Sarah Johnson',
    userUsername: 'sarah_cs',
    userUniversity: 'MIT',
    content: 'Just aced my Data Structures exam! 🎉 All those late-night study sessions with the group finally paid off. If anyone needs help with binary trees, hit me up!',
    likes: ['3', '4', '5'],
    comments: [
      { id: 'c1', userId: '3', userName: 'Mike Chen', content: 'Congrats Sarah! 🔥 You deserve it!', createdAt: new Date(Date.now() - 1000 * 60 * 20) },
      { id: 'c2', userId: '4', userName: 'Emma Williams', content: 'Can you share your notes? I have the same exam next week 😅', createdAt: new Date(Date.now() - 1000 * 60 * 15) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    userId: '3',
    userName: 'Mike Chen',
    userUsername: 'mike_eng',
    userUniversity: 'Stanford',
    content: 'Working on my capstone project — building a solar-powered drone! 🛸☀️ Anyone interested in joining the team? We need someone who knows about aerodynamics.',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=400&fit=crop',
    likes: ['2', '4', '5', '1'],
    comments: [
      { id: 'c3', userId: '5', userName: 'Alex Rivera', content: 'This is incredible! I\'d love to help with the math modeling!', createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: '3',
    userId: '4',
    userName: 'Emma Williams',
    userUsername: 'emma_bio',
    userUniversity: 'Harvard',
    content: 'Lab day! 🧬 Finally got my cell cultures growing after 3 failed attempts. Persistence is key in research. Never give up on your experiments!',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&h=400&fit=crop',
    likes: ['2', '3'],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    id: '4',
    userId: '5',
    userName: 'Alex Rivera',
    userUsername: 'alex_math',
    userUniversity: 'Caltech',
    content: 'Just discovered Euler\'s identity for the first time and my mind is blown 🤯 e^(iπ) + 1 = 0. Mathematics is the language of the universe!',
    likes: ['2', '3', '4'],
    comments: [
      { id: 'c4', userId: '2', userName: 'Sarah Johnson', content: 'Wait until you learn about the Riemann Hypothesis! 🧠', createdAt: new Date(Date.now() - 1000 * 60 * 240) },
      { id: 'c5', userId: '3', userName: 'Mike Chen', content: 'Math nerds unite! 😄', createdAt: new Date(Date.now() - 1000 * 60 * 230) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 300),
  },
  {
    id: '5',
    userId: '2',
    userName: 'Sarah Johnson',
    userUsername: 'sarah_cs',
    userUniversity: 'MIT',
    content: 'Pro tip for CS students: Start your assignments early and break them into small tasks. Also, rubber duck debugging is real — explain your code to a duck 🦆 and you\'ll find the bug!',
    likes: ['3', '4', '5', '1'],
    comments: [
      { id: 'c6', userId: '5', userName: 'Alex Rivera', content: 'This is actually solid advice. I started doing this and my productivity doubled!', createdAt: new Date(Date.now() - 1000 * 60 * 400) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 420),
  },
];

export const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: '1',
    name: 'CS101 – Intro to Programming',
    category: 'Computer Science',
    description: 'Discussion room for CS101 students. Share code, ask questions, and help each other.',
    memberCount: 127,
    lastMessage: 'Can someone explain recursion one more time? 😅',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    isActive: true,
  },
  {
    id: '2',
    name: 'Physics Lab Partners',
    category: 'Physics',
    description: 'Find lab partners and discuss experiments.',
    memberCount: 56,
    lastMessage: 'Lab 7 is due this Friday, don\'t forget!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    isActive: true,
  },
  {
    id: '3',
    name: 'Study Group – Calculus III',
    category: 'Mathematics',
    description: 'Weekly study sessions for Calculus III. Mondays and Wednesdays at 7 PM.',
    memberCount: 34,
    lastMessage: 'Meeting at the library tonight?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 90),
    isActive: false,
  },
  {
    id: '4',
    name: 'BIO200 – Molecular Biology',
    category: 'Biology',
    description: 'All things molecular biology. Lab protocols, study materials, and exam prep.',
    memberCount: 89,
    lastMessage: 'The midterm review session really helped!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    isActive: true,
  },
  {
    id: '5',
    name: 'Campus Events & Meetups',
    category: 'General',
    description: 'Share and discover campus events, hackathons, and social gatherings.',
    memberCount: 312,
    lastMessage: 'Hackathon this weekend! Who\'s in?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 10),
    isActive: true,
  },
  {
    id: '6',
    name: 'Engineering Capstone Projects',
    category: 'Engineering',
    description: 'Collaborate on capstone projects and share progress.',
    memberCount: 45,
    lastMessage: 'Just finished the prototype! Check out the demo video.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 200),
    isActive: false,
  },
];

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}