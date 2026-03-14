import { motion } from 'motion/react';

const steps = [
  {
    number: '01',
    title: 'Create Exams',
    description: 'Build your exams using our intuitive drag-and-drop builder with support for multiple sections.',
  },
  {
    number: '02',
    title: 'Assign Students',
    description: 'Select classes or individual students and set specific time windows for the examination.',
  },
  {
    number: '03',
    title: 'Conduct Exams',
    description: 'Students log in to their secure portal to take exams with real-time monitoring.',
  },
  {
    number: '04',
    title: 'Auto Grade',
    description: 'System automatically grades objective questions and notifies teachers for subjective parts.',
  },
  {
    number: '05',
    title: 'Publish Results',
    description: 'Generate and publish results instantly to student and parent portals with one click.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '60px 60px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-kenya-green font-semibold tracking-wide uppercase text-sm mb-3">Process</h2>
          <p className="text-4xl font-bold text-kenya-black mb-4">How Alakara KE Works</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A seamless workflow from exam creation to result publishing in five simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-kenya-red/10 -translate-y-1/2 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-8 inline-block">
                  <div className="w-16 h-16 rounded-full bg-kenya-black text-white flex items-center justify-center text-xl font-bold z-10 relative group-hover:scale-110 transition-transform shadow-lg shadow-kenya-black/20 border-2 border-kenya-red">
                    {step.number}
                  </div>
                  <div className="absolute inset-0 bg-kenya-red rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-kenya-black mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
