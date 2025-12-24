import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Github, Linkedin, Mail } from 'lucide-react';

const footerLinks = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '/features' },
			{ title: 'How to Use', href: '/how-to-use' },
			{ title: 'Verify Document', href: '/verify' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'FAQs', href: '/faqs' },
			{ title: 'About Us', href: '/about' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '/blog' },
			{ title: 'Help Center', href: '/help' },
		],
	},
	{
		label: 'Connect',
		links: [
			{ title: 'GitHub', href: 'https://github.com/mujju-212', icon: Github },
			{ title: 'LinkedIn', href: 'https://www.linkedin.com/in/mujutaba-m-n-0ab114302', icon: Linkedin },
			{ title: 'Email', href: 'mailto:mujju718263@gmail.com', icon: Mail },
		],
	},
];

export function Footer() {
	return (
		<footer className="relative w-full flex flex-col items-center justify-center border-t border-white/10 bg-black px-6 py-12 lg:py-16">
			<div className="bg-white/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full max-w-7xl gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<Shield className="size-8 text-blue-500" />
					<p className="text-gray-400 mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} DocuChain. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs text-white">{section.label}</h3>
								<ul className="text-gray-400 mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-white inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-1 size-4" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

function AnimatedContainer({ className, delay = 0.1, children }) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
