import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Video, 
  PieChart, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Building2,
  ListTodo,
  Share2,
  VideoIcon,
  MessageCircle,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
      {/* Navbar placeholder */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">TeamSync</span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a href="#features" className="text-sm font-medium hover:text-indigo-600 transition-colors">Features</a>
          <a href="#why-us" className="text-sm font-medium hover:text-indigo-600 transition-colors">Why Us</a>
          <a href="#pricing" className="text-sm font-medium hover:text-indigo-600 transition-colors">Pricing</a>
        </nav>
        <Link to="/auth/signin">
        <Button className="hidden md:flex bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none hover:from-indigo-700 hover:to-purple-700">
          Log In
        </Button>
        </Link>
      </header>

      {/* Hero Section with Abstract Shapes */}
      <div className="container mx-auto px-4 py-16 relative">
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-40 left-20 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="text-center mb-24 relative">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 mb-4">
            Redefining Teamwork
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 leading-tight max-w-4xl mx-auto">
            Transform How Teams Collaborate & Achieve
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Empower managers to lead multiple teams efficiently with our all-in-one collaboration platform
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link to ="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-full px-8 shadow-lg shadow-indigo-500/30">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-indigo-400 text-indigo-700 hover:bg-indigo-50">
              See Demo
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center text-gray-600">
            <span className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> 99.9% Uptime
            </span>
            <span className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> 5,000+ Teams
            </span>
            <span className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Enterprise Ready
            </span>
          </div>
        </div>

        {/* Main Features Showcase - Cards with hover effects */}
        <div className="grid lg:grid-cols-3 gap-8 mb-24" id="features">
          <Card className="p-8 relative overflow-hidden group border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl hover:shadow-indigo-200/50 transition-all">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-between items-start mb-6">
              <ListTodo className="h-10 w-10 text-indigo-600 p-2 bg-indigo-100 rounded-lg" />
              <span className="text-xs font-medium text-gray-500">01</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 group-hover:text-indigo-600 transition-colors">Task Management</h3>
            <p className="text-gray-600 mb-6">Streamline your workflow with intuitive task creation and tracking capabilities.</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                </div>
                Intuitive task creation
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                </div>
                Real-time progress tracking
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                </div>
                Smart deadline management
              </li>
            </ul>
            <Button variant="ghost" className="mt-6 p-0 text-indigo-600 hover:text-indigo-800 transition-colors">
              Learn more <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>

          <Card className="p-8 relative overflow-hidden group border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-200/50 transition-all">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <div className="flex justify-between items-start mb-6">
              <VideoIcon className="h-10 w-10 text-purple-600 p-2 bg-purple-100 rounded-lg" />
              <span className="text-xs font-medium text-gray-500">02</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 group-hover:text-purple-600 transition-colors">Video Conferencing</h3>
            <p className="text-gray-600 mb-6">Connect your teams with crystal-clear video meetings and collaborative features.</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-purple-600" />
                </div>
                HD video with low latency
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-purple-600" />
                </div>
                Advanced screen sharing
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-purple-600" />
                </div>
                Cloud recording & transcripts
              </li>
            </ul>
            <Button variant="ghost" className="mt-6 p-0 text-purple-600 hover:text-purple-800 transition-colors">
              Learn more <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>

          <Card className="p-8 relative overflow-hidden group border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-200/50 transition-all">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex justify-between items-start mb-6">
              <MessageCircle className="h-10 w-10 text-blue-600 p-2 bg-blue-100 rounded-lg" />
              <span className="text-xs font-medium text-gray-500">03</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">Team Chat</h3>
            <p className="text-gray-600 mb-6">Keep conversations flowing with real-time messaging and integrated file sharing.</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-blue-600" />
                </div>
                Instant messaging
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-blue-600" />
                </div>
                Threaded discussions
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-blue-600" />
                </div>
                Smart file organization
              </li>
            </ul>
            <Button variant="ghost" className="mt-6 p-0 text-blue-600 hover:text-blue-800 transition-colors">
              Learn more <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>
        </div>

        {/* Secondary Features in a more elegant grid */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 mb-4">
              Everything You Need
            </span>
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700">Powerful Features for Modern Teams</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides everything you need for seamless team management
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-indigo-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">Team Management</h3>
              <p className="text-gray-600">
                Create and manage multiple teams with 5-6 members each. Seamlessly invite members through email invitations.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-purple-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-purple-100">
                <Share2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-800">Resource Sharing</h3>
              <p className="text-gray-600">
                Share documents, presentations, and resources within your team's dedicated space with advanced access controls.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-blue-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-blue-100">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-800">Virtual Rooms</h3>
              <p className="text-gray-600">
                Dedicated meeting rooms for team discussions, with integrated chat and file sharing capabilities.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-indigo-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-indigo-100">
                <PieChart className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">Visual Analytics</h3>
              <p className="text-gray-600">
                Real-time analytics with interactive charts for comprehensive team performance monitoring and insights.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-purple-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-800">Documentation</h3>
              <p className="text-gray-600">
                Keep all project documentation and resources organized with searchable archives and version history.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md bg-gradient-to-br from-white to-blue-50">
              <div className="mb-6 p-3 inline-flex rounded-lg bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-800">Smart Scheduling</h3>
              <p className="text-gray-600">
                AI-powered calendar management with team availability tracking and automated scheduling suggestions.
              </p>
            </Card>
          </div>
        </div>

        {/* Why Choose Us Section - More modern and engaging */}
        <div className="mt-24 mb-16" id="why-us">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 mb-4">
              Why TeamSync
            </span>
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700">The platform managers trust</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of successful teams who've revolutionized their workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-white to-indigo-50 p-4 rounded-full shadow-lg border border-indigo-100">
                  <Building2 className="h-12 w-12 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Multi-Team Support</h3>
              <p className="text-gray-600">
                Effortlessly manage 2-3 teams simultaneously with customized workflows and permissions
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-white to-purple-50 p-4 rounded-full shadow-lg border border-purple-100">
                  <Clock className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Real-time Updates</h3>
              <p className="text-gray-600">
                Stay informed with instant progress tracking and smart notifications across all your teams
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-white to-blue-50 p-4 rounded-full shadow-lg border border-blue-100">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-800">Team Collaboration</h3>
              <p className="text-gray-600">
                Foster seamless communication with intuitive tools designed for modern, distributed teams
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 mb-16">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 relative overflow-hidden shadow-2xl shadow-indigo-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to transform your team's workflow?</h2>
              <p className="text-indigo-100 mb-8">
                Join thousands of managers who've revolutionized how their teams collaborate and achieve goals.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-full px-8 shadow-lg">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 border-white text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-indigo-100 pt-12 pb-6 mt-24">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">TeamSync</span>
              </div>
              <p className="text-sm text-gray-600">
                Transforming team collaboration for the modern workplace
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-indigo-800">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Features</li>
                <li>Integrations</li>
                <li>Pricing</li>
                <li>Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-purple-800">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Documentation</li>
                <li>Blog</li>
                <li>Guides</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-blue-800">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>About</li>
                <li>Customers</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="text-sm text-gray-500 text-center pt-8 border-t border-indigo-100">
            © 2025 TeamSync. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;