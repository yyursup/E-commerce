import { useRef, useEffect, useState } from 'react';

const FRAME_COUNT = 240;
const IMAGES_PATH = '/product-sequence/ezgif-frame-';

export default function ProductSequence() {
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);
    const requestRef = useRef();
    const directionRef = useRef(0); // 0: stop, 1: forward, -1: backward

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = [];
            const promises = [];

            for (let i = 1; i <= FRAME_COUNT; i++) {
                const promise = new Promise((resolve) => {
                    const img = new Image();
                    const paddedIndex = i.toString().padStart(3, '0');
                    img.src = `${IMAGES_PATH}${paddedIndex}.jpg`;
                    img.onload = () => {
                        loadedImages[i - 1] = img;
                        resolve();
                    };
                    // Handle error just in case, though we assume files exist
                    img.onerror = resolve;
                });
                promises.push(promise);
            }

            await Promise.all(promises);
            setImages(loadedImages);
            setLoading(false);
        };

        loadImages();
    }, []);

    // Draw current frame
    useEffect(() => {
        if (!canvasRef.current || images.length === 0 || !images[currentFrame]) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = images[currentFrame];

        // Maintain aspect ratio cover or contain? 
        // The previous image was object-contain.
        // We'll scale to fit canvas width/height maintaining aspect ratio

        // Set canvas internal size to match display size (optional, for sharpness)
        // Or just set it to image size and let CSS handle scaling.
        // Use image size for best quality
        const cropBottom = 40; // Pixels to remove from bottom
        if (canvas.width !== img.width) canvas.width = img.width;
        if (canvas.height !== img.height - cropBottom) canvas.height = img.height - cropBottom;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height - cropBottom, 0, 0, canvas.width, canvas.height);

    }, [currentFrame, images]);

    // Animation Loop
    const animate = () => {
        if (directionRef.current === 0) return;

        setCurrentFrame((prev) => {
            let next = prev + directionRef.current;

            // Loop or clamp? User said "motion when hover", usually means scrubbing or loop.
            // Let's Clamp for now, "assemble/disassemble" implies start/end states.
            if (next >= FRAME_COUNT - 1) {
                next = FRAME_COUNT - 1;
                if (directionRef.current === 1) directionRef.current = 0; // Stop at end
            } else if (next <= 0) {
                next = 0;
                if (directionRef.current === -1) directionRef.current = 0; // Stop at start
            }

            return next;
        });

        if (directionRef.current !== 0) {
            // Control speed? 60fps might be too fast if frames are 240. 240/60 = 4s. 
            // Seems okay for a detailed animation.
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (directionRef.current !== 0) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [directionRef.current]); // This dependency array is a bit tricky with ref, usually trigger via state or event

    const handleMouseEnter = () => {
        directionRef.current = 1;
        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
        directionRef.current = -1;
        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
    };

    return (
        <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Loading...
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain mix-blend-screen"
            />
        </div>
    );
}
