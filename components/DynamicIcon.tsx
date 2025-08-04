import React from 'react';
import {
  BookOpen, History, Rocket, BookCopy, MessageSquareQuote, Feather, Brain, Code, Anchor, Cloud,
  Compass, Database, Globe, Heart, Key, Map, Moon, Star, Sun, Target, Atom, Beaker, Bot,
  Award, BarChart, Bell, Bookmark, Briefcase, Building, Calendar, Camera, CheckSquare,
  Clipboard, Cog, CreditCard, Crop, Diamond, Disc, Dna, Droplet, File, Film, Filter, Flag,
  Folder, GitBranch, GitCommit, GitMerge, GraduationCap, Grid, HardDrive, Hash, Headphones,
  Image, Inbox, Info, Languages, Layers, Layout, LifeBuoy, Link, Lock, LogIn, Mail,
  Maximize, Mic, Minimize, MousePointer, Music, Package, Paperclip, Pause, Phone, PieChart,
  Pin, Power, Printer, Puzzle, QrCode, Quote, RefreshCcw, Rss, Save, Search, Send, Settings,
  Share2, Shield, ShoppingCart, Slash, Smartphone, Speaker, Square, Tag, ThumbsUp, Wrench,
  Train, Trash, TrendingUp, Truck, Tv, Type, Umbrella, Unlock, Upload, User, Video, Voicemail,
  Volume2, Watch, Wifi, Wind, Zap, ZoomIn, ZoomOut
} from 'lucide-react';

export const AllIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  BookOpen, History, Rocket, BookCopy, MessageSquareQuote, Feather, Brain, Code, Anchor, Cloud,
  Compass, Database, Globe, Heart, Key, Map, Moon, Star, Sun, Target, Atom, Beaker, Bot,
  Award, BarChart, Bell, Bookmark, Briefcase, Building, Calendar, Camera, CheckSquare,
  Clipboard, Cog, CreditCard, Crop, Diamond, Disc, Dna, Droplet, File, Film, Filter, Flag,
  Folder, GitBranch, GitCommit, GitMerge, GraduationCap, Grid, HardDrive, Hash, Headphones,
  Image, Inbox, Info, Languages, Layers, Layout, LifeBuoy, Link, Lock, LogIn, Mail,
  Maximize, Mic, Minimize, MousePointer, Music, Package, Paperclip, Pause, Phone, PieChart,
  Pin, Power, Printer, Puzzle, QrCode, Quote, RefreshCcw, Rss, Save, Search, Send, Settings,
  Share2, Shield, ShoppingCart, Slash, Smartphone, Speaker, Square, Tag, ThumbsUp, Wrench,
  Train, Trash, TrendingUp, Truck, Tv, Type, Umbrella, Unlock, Upload, User, Video, Voicemail,
  Volume2, Watch, Wifi, Wind, Zap, ZoomIn, ZoomOut
};

export const iconNames = Object.keys(AllIcons);

const DefaultIcon = BookCopy;

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = AllIcons[name];

  if (!IconComponent) {
    return <DefaultIcon {...props} />;
  }

  return <IconComponent {...props} />;
};

export default DynamicIcon;