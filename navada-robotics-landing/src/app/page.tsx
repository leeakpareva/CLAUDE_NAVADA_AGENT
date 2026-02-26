import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Cpu,
  Zap,
  Eye,
  Cog,
  ArrowRight,
  Radio,
  CircuitBoard,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* Scanline overlay effect */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold tracking-widest uppercase text-emerald-400">
              NAVADA
            </span>
            <span className="text-lg font-light tracking-widest uppercase text-zinc-500">
              Robotics
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 uppercase tracking-wider">
              Systems Online
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <Badge
            variant="outline"
            className="mb-6 border-emerald-400/30 text-emerald-400 font-mono text-xs tracking-widest"
          >
            <Radio className="mr-1.5 h-3 w-3" />
            EST. 2024 — LONDON, UK
          </Badge>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            <span className="text-emerald-400">Building</span> the future
            <br />
            of intelligent
            <br />
            <span className="text-zinc-500">machines.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
            Autonomous systems. Computer vision. Edge AI deployment.
            We engineer robots that see, think, and act.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300 font-mono uppercase tracking-wider text-sm h-12 px-8">
              View Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-mono uppercase tracking-wider text-sm h-12 px-8"
            >
              Get in Touch
            </Button>
          </div>

          {/* Terminal-style decoration */}
          <div className="mt-16 rounded border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-zinc-600 mb-2">
              <span className="text-emerald-400">$</span> navada --status
            </div>
            <div className="text-zinc-500">
              <span className="text-emerald-400">CORE</span> ............ operational
              <br />
              <span className="text-emerald-400">VISION</span> .......... active
              <br />
              <span className="text-emerald-400">ACTUATORS</span> ....... calibrated
              <br />
              <span className="text-emerald-400">AI ENGINE</span> ....... ready
              <br />
              <span className="text-zinc-400">
                &gt; All systems nominal. Awaiting instructions.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
              // Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Core Systems
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6">
                <Eye className="mb-4 h-8 w-8 text-emerald-400" />
                <h3 className="text-lg font-bold mb-2">Computer Vision</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  YOLOv8 real-time object detection. MediaPipe gesture recognition.
                  Custom-trained models for industrial inspection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6">
                <Cpu className="mb-4 h-8 w-8 text-emerald-400" />
                <h3 className="text-lg font-bold mb-2">Edge AI</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Raspberry Pi deployment. On-device inference. Low-latency
                  processing without cloud dependency.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6">
                <Cog className="mb-4 h-8 w-8 text-emerald-400" />
                <h3 className="text-lg font-bold mb-2">Autonomous Navigation</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  PiCrawler spider robot. Servo control systems. Obstacle avoidance
                  with real-time sensor fusion.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6">
                <Zap className="mb-4 h-8 w-8 text-emerald-400" />
                <h3 className="text-lg font-bold mb-2">ML Engineering</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  QLoRA fine-tuning. Multi-agent architectures. GPU-accelerated
                  training on Paperspace A4000.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
              // Specifications
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Tech Stack
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3">
                Hardware
              </h4>
              <Separator className="bg-zinc-800 mb-3" />
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Raspberry Pi 4/5
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  PiCrawler Robot Kit
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Servo Controllers
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Camera Modules
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3">
                Software
              </h4>
              <Separator className="bg-zinc-800 mb-3" />
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  PyTorch / ONNX
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  YOLOv8 / MediaPipe
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  OpenCV / NumPy
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  ROS2 / Python
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3">
                Cloud / GPU
              </h4>
              <Separator className="bg-zinc-800 mb-3" />
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Paperspace A4000
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Azure AI Foundry
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Hugging Face Hub
                </li>
                <li className="flex items-center gap-2">
                  <CircuitBoard className="h-3 w-3 text-zinc-600" />
                  Docker / Edge Deploy
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to build something?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            From concept to deployment — autonomous systems engineered for the real world.
          </p>
          <Button className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300 font-mono uppercase tracking-wider text-sm h-12 px-10">
            Start a Project
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-zinc-600" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">
              NAVADA Robotics &copy; 2024
            </span>
          </div>
          <div className="text-xs text-zinc-700 font-mono">
            navadarobotics.com
          </div>
        </div>
      </footer>
    </div>
  );
}
