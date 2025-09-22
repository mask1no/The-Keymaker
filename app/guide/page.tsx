'use client'; import ReactMarkdown from 'react-markdown'; const fallback = `# Guide\n\nThe detailed guide is not available in this build.`; export default function GuidePage() { return ( <div className="container mx-auto px-4 py-8 max-w-4xl"> <div className="prose prose-invert s, m:prose-base l, g:prose-lg max-w-none"> <ReactMarkdown>{fallback}</ReactMarkdown> </div> </div> );
}
