import '../../Main.css';
import { useState, useRef, useEffect, forwardRef } from 'react';
import { generateSituationMeme } from 'wasp/client/operations';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import html2canvas from 'html2canvas';

import lizardImage from '../../static/monitor_lizard.jpeg';
import overlookingImage from '../../static/overlooking.jpeg';
import crabDroneImage from '../../static/crab-drone.jpeg';
import husbantImage from '../../static/husbant.jpeg';
import povImage from '../../static/pov.png';

const MEME_CHOICES = [
  {
    imageName: 'monitor_lizard.jpeg',
    topText: 'BORN TO MONITOR',
    bottomText: '<situation> SITUATION',
  },
  {
    imageName: 'overlooking.jpeg',
    topText: 'I WILL ALWAYS MONITOR',
    bottomText: '<situation> SITUATION',
  },
  {
    imageName: 'crab-drone.jpeg',
    topText: 'ON MY WAY TO MONITOR',
    bottomText: '<situation> SITUATION',
  },
  {
    imageName: 'husbant.jpeg',
    topText: 'OH HUSBANT YOU DID NOT MONITOR',
    bottomText: '<situation> SITUATION AND NOW WE ARE HOMERESS',
  },
  {
    imageName: 'pov.png',
    topText: 'I AM THE SITUATION',
    bottomText: 'BUT <situation> MUST BE MONITORED',
  },
];

const imageMap: { [key: string]: string } = {
  'monitor_lizard.jpeg': lizardImage,
  'overlooking.jpeg': overlookingImage,
  'crab-drone.jpeg': crabDroneImage,
  'husbant.jpeg': husbantImage,
  'pov.png': povImage,
};

type MemeData = {
  imageName: string;
  topText: string;
  bottomText: string;
  profileImageUrl: string;
  handle: string;
};

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Meme Display Component
const MemeDisplay = forwardRef<HTMLDivElement, MemeData>(({ imageName, topText, bottomText, profileImageUrl, handle }, ref) => {
  const imageUrl = imageMap[imageName];

  return (
    <div ref={ref} className='meme-container'>
      <div className='relative'>
        <img src={imageUrl} alt='Generated meme' className='border-x border-t w-full' crossOrigin='anonymous' />
        <div className='meme-text top-2'>{topText}</div>
        <div className='meme-text bottom-2'>{bottomText}</div>
      </div>
      <div className='bg-black text-white p-2 flex items-center justify-between'>
        <div className='flex items-center'>
          <img src={profileImageUrl} alt='User profile' className='w-8 h-8 rounded-full mr-2' crossOrigin='anonymous' />
          <span className='font-semibold text-sm'>@{handle}</span>
        </div>
        <span className='text-sm font-mono'>sit-mon-client.fly.dev</span>
      </div>
    </div>
  );
});

export function HomePage() {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memeData, setMemeData] = useState<MemeData | null>(null);
  const [searchedHandles, setSearchedHandles] = useState<Set<string>>(new Set());
  const [remixIndices, setRemixIndices] = useState<Map<string, number>>(new Map());
  const memeRef = useRef<HTMLDivElement>(null);

  // Load state from local storage on initial render
  useEffect(() => {
    const storedHandles = localStorage.getItem('searchedHandles');
    if (storedHandles) {
      setSearchedHandles(new Set(JSON.parse(storedHandles)));
    }
    const storedIndices = localStorage.getItem('remixIndices');
    if (storedIndices) {
      setRemixIndices(new Map(JSON.parse(storedIndices)));
    }
  }, []);

  const handleDownload = () => {
    if (!memeRef.current) return;

    html2canvas(memeRef.current, {
      useCORS: true, // Allow loading cross-origin images
      onclone: (document) => {
        // Find the elements in the cloned document
        const clonedElement = document.documentElement.querySelector('.meme-container'); // We'll add this class
        if (clonedElement) {
          // Remove borders for the screenshot
          const img = clonedElement.querySelector('img');
          if (img) {
            img.classList.remove('border-x', 'border-t');
          }
          const textElements = clonedElement.querySelectorAll<HTMLElement>('.meme-text');
          textElements.forEach(element => {
            // text should have a thin black outline similar to the image
            element.style.textShadow = '0 0 2px black';
            if (element.classList.contains('top-2')) {
              element.style.top = '-5px'; // Tighter top padding
            }
            if (element.classList.contains('bottom-2')) {
              element.style.bottom = '20px'; // Keep bottom padding
            }
          });
        }
      },
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'situation-meme.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!handle) {
      alert('Please enter a Twitter handle.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMemeData(null);

    try {
      const { situation, profileImageUrl } = await generateSituationMeme({ handle });

      const lowerCaseHandle = handle.toLowerCase();
      let memeTemplateIndex;

      // If it's a remix, cycle to the next index. Otherwise, pick randomly.
      if (searchedHandles.has(lowerCaseHandle)) {
        const currentIndex = remixIndices.get(lowerCaseHandle) ?? -1;
        memeTemplateIndex = (currentIndex + 1) % MEME_CHOICES.length;
      } else {
        memeTemplateIndex = Math.floor(Math.random() * MEME_CHOICES.length);
      }

      // Update the index map for the current handle
      const newRemixIndices = new Map(remixIndices);
      newRemixIndices.set(lowerCaseHandle, memeTemplateIndex);
      setRemixIndices(newRemixIndices);
      localStorage.setItem('remixIndices', JSON.stringify(Array.from(newRemixIndices.entries())));

      const chosenMemeTemplate = MEME_CHOICES[memeTemplateIndex];

      const finalMemeData = {
        imageName: chosenMemeTemplate.imageName,
        topText: chosenMemeTemplate.topText.replace('<situation>', situation.toUpperCase()),
        bottomText: chosenMemeTemplate.bottomText.replace('<situation>', situation.toUpperCase()),
        profileImageUrl,
        handle: handle,
      };

      setMemeData(finalMemeData);

      // Add handle to searched list if it's new
      if (!searchedHandles.has(lowerCaseHandle)) {
        const newSearchedHandles = new Set(searchedHandles);
        newSearchedHandles.add(lowerCaseHandle);
        setSearchedHandles(newSearchedHandles);
        localStorage.setItem('searchedHandles', JSON.stringify(Array.from(newSearchedHandles)));
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isLoading
    ? 'Monitoring...'
    : searchedHandles.has(handle.toLowerCase())
    ? 'Remix My Situation'
    : 'Monitor My Situation';

  return (
    <div className='flex flex-col min-h-screen'>
      <main className='flex-grow flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Do You Monitor the Situation?</CardTitle>
            <CardDescription>Enter your Twitter handle to get your situation monitoring analysis. It's very scientific.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className='flex w-full items-center space-x-2'>
                <span className='text-gray-500'>@</span>
                <Input type='text' placeholder='elonmusk' value={handle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHandle(e.target.value)} className='flex-grow' disabled={isLoading} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type='submit' className='w-full' disabled={isLoading}>
                {buttonText}
              </Button>
            </CardFooter>
          </form>

          {isLoading && (
            <CardContent className='flex justify-center items-center p-6'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
            </CardContent>
          )}

          {error && (
            <CardContent>
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative' role='alert'>
                <strong className='font-bold'>Error: </strong>
                <span className='block sm:inline'>{error}</span>
              </div>
            </CardContent>
          )}

          {memeData && (
            <CardContent>
              <MemeDisplay {...memeData} ref={memeRef} />
              <div className="flex justify-end mt-2">
                <Button onClick={handleDownload} variant="ghost" size="icon">
                  <DownloadIcon className="h-6 w-6" />
                  <span className="sr-only">Download Situation Analysis</span>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </main>
      <footer className='text-center p-4 text-sm text-gray-500'>
          vibe-coded really fast with {' '}
          <a
            href='https://wasp.sh'
            target='_blank'
            rel='noopener noreferrer'
            className='underline text-yellow-500 hover:text-yellow-600 transition-colors'
          >
            Wasp.sh
          </a>
          <span>{` 🐝`}</span>
      </footer>
    </div>
  );
}