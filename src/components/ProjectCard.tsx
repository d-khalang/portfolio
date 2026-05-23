import React from 'react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  project: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <motion.article 
      initial={{ y: 100, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="project-card-journey min-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-midnight"
    >
      {/* Browser Bar */}
      <div className="bg-midnight p-3 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-rust" />
        <div className="w-3 h-3 rounded-full bg-ochre" />
        <div className="w-3 h-3 rounded-full bg-deepTeal" />
      </div>

      <div className="p-8">
        <div className="aspect-video bg-alabaster rounded-lg mb-6 overflow-hidden">
           {/* Image placeholder */}
           <div className="w-full h-full flex items-center justify-center text-midnight font-bold">
             {project.core.title}
           </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-rust">
            Project {project.id}
          </span>
          <h3 className="text-3xl font-bold text-midnight uppercase">
            "{project.core.title}"
          </h3>
          <p className="text-midnight font-medium border-t border-midnight/10 pt-4">
            {project.core.tagline}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;
