require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const text = `Machine Learning and the Jobs of the Future.

Machine learning is no longer a futuristic concept discussed only in research labs. It's embedded in the apps we use, the recommendations we see, the fraud alerts from our banks, and even the cars we drive. Quietly, almost invisibly, it is reshaping the nature of work.

For years, the dominant narrative was fear: machines will take our jobs. And yes, automation is changing certain roles. Repetitive tasks in data entry, basic analysis, and routine operations are increasingly handled by algorithms. But history tells us something important — technology rarely just removes jobs; it transforms them.

The printing press didn't eliminate storytelling. It expanded it. The internet didn't end commerce; it reinvented it. In the same way, machine learning is not eliminating human value — it is redefining it.

The jobs of the future will likely fall into three broad categories.

First, builders — the engineers, data scientists, and AI architects designing intelligent systems. These roles require technical depth, but also creativity and ethical awareness. Building models is one thing; building responsible, scalable systems that integrate into real businesses is another.

Second, translators — professionals who understand both technology and business. These are product managers, AI consultants, policy experts, and domain specialists who can bridge the gap between algorithms and real-world problems. As ML becomes more accessible, the ability to ask the right questions may become more valuable than the ability to code the answers.

Third, and perhaps most importantly, human amplifiers — people who use AI tools to enhance their own work. Teachers using adaptive learning platforms. Doctors using predictive diagnostics. Designers generating rapid prototypes. Analysts exploring data in minutes rather than weeks. In these roles, AI doesn't replace the human; it augments them.

Soft skills will matter more, not less. Critical thinking, emotional intelligence, ethical judgment, and creativity are difficult to automate. As machines become better at pattern recognition, humans will focus more on meaning, context, and values.

The future of work will not simply be "humans vs machines." It will be humans working alongside intelligent systems. Those who adapt, who remain curious, and who see AI as a tool rather than a threat, will likely find themselves in roles that are more strategic, more creative, and more impactful than ever before.

Machine learning is not just changing what we do. It's changing what we're free to focus on.`;

async function speak() {
  console.log("Generating speech with OpenAI TTS (voice: onyx)...");

  const outputPath = path.join(__dirname, "tts-output.mp3");

  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "onyx",
    input: text,
    speed: 1.0,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`Audio saved to ${outputPath}`);
  console.log("Playing audio...");

  // Play using PowerShell's media player on Windows
  execSync(`powershell -Command "Add-Type -AssemblyName PresentationCore; $player = New-Object System.Windows.Media.MediaPlayer; $player.Open([Uri]::new('${outputPath.replace(/\\/g, "\\\\")}')); $player.Play(); Start-Sleep -Seconds 1; while ($player.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 500 }; $duration = $player.NaturalDuration.TimeSpan.TotalSeconds; Start-Sleep -Seconds ([Math]::Ceiling($duration)); $player.Close()"`, {
    stdio: "inherit",
  });

  console.log("Playback complete.");
}

speak().catch(console.error);
