import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

function TimelineEntry({
  item,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
}) {
  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="flex md:flex">
        <div className="flex items-start gap-6 group w-full">
          <div className="flex-shrink-0 w-40">
            <dl>
              <dt className="sr-only">Date</dt>
              <dd
                className={cn(
                  "text-sm font-medium text-gray-400 transition-colors group-hover:text-white",
                  dateClassName
                )}
              >
                <time dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </dd>
            </dl>
          </div>
          <div className="flex items-start gap-4 flex-1">
            <div className="relative flex-shrink-0" style={{ minWidth: '40px' }}>
              <div
                className={cn("h-full min-h-[96px] border-l-2 border-gray-700", lineClassName)}
              />
              <div
                className={cn(
                  "absolute -left-[17px] top-6 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 ring-4 ring-blue-500/20 transition-colors group-hover:bg-blue-400 group-hover:ring-blue-400/30 z-10",
                  !item.icon && "h-3 w-3",
                  dotClassName
                )}
              >
                {item.icon && (
                  <div className="h-6 w-6 text-white flex items-center justify-center">{item.icon}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-4 flex-1 min-w-0">
              <h3
                className={cn(
                  "text-xl font-semibold tracking-tight text-white",
                  titleClassName
                )}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={cn(
                    "text-base text-gray-400 leading-relaxed",
                    descriptionClassName
                  )}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-start gap-4 p-4">
          <div className="relative flex-shrink-0">
            <div className={cn("h-20 border-l-2 border-gray-700", lineClassName)} />
            <div
              className={cn(
                "absolute -left-[7px] top-8 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 ring-2 ring-blue-500/30",
                !item.icon && "h-3 w-3",
                dotClassName
              )}
            >
              {item.icon && (
                <div className="h-5 w-5 text-white flex items-center justify-center">{item.icon}</div>
              )}
            </div>
          </div>
          <div className="flex-1 pt-2">
            <dl className="mb-2">
              <dt className="sr-only">Date</dt>
              <dd
                className={cn(
                  "text-xs font-medium text-gray-500",
                  dateClassName
                )}
              >
                <time dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </dd>
            </dl>
            <h3
              className={cn(
                "text-lg font-semibold tracking-tight text-white mb-1",
                titleClassName
              )}
            >
              {item.title}
            </h3>
            {item.description && (
              <p
                className={cn(
                  "text-sm text-gray-400 leading-relaxed",
                  descriptionClassName
                )}
              >
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Timeline({
  items,
  initialCount = 5,
  className,
  showMoreText = "Show More",
  showLessText = "Show Less",
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
  buttonVariant = "ghost",
  buttonSize = "sm",
  animationDuration = 0.3,
  animationDelay = 0.1,
  showAnimation = true,
}) {
  const [showAll, setShowAll] = useState(false);
  const sortedItems = items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const initialItems = sortedItems.slice(0, initialCount);
  const remainingItems = sortedItems.slice(initialCount);

  return (
    <div className={cn("mx-auto max-w-4xl md:max-w-6xl lg:max-w-7xl px-4 relative z-20", className)}>
      <div className="w-full">
        <ul className="space-y-12 w-full">
          {initialItems.map((item, index) => (
            <motion.li
              key={index}
              initial={showAnimation ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationDuration,
                delay: index * animationDelay,
              }}
              className="w-full"
            >
              <TimelineEntry
                item={item}
                dotClassName={dotClassName}
                lineClassName={lineClassName}
                titleClassName={titleClassName}
                descriptionClassName={descriptionClassName}
                dateClassName={dateClassName}
              />
            </motion.li>
          ))}
          <AnimatePresence>
            {showAll &&
              remainingItems.map((item, index) => (
                <motion.li
                  key={index + initialCount}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: animationDuration,
                    delay: index * animationDelay,
                  }}
                  className="w-full"
                >
                  <TimelineEntry
                    item={item}
                    dotClassName={dotClassName}
                    lineClassName={lineClassName}
                    titleClassName={titleClassName}
                    descriptionClassName={descriptionClassName}
                    dateClassName={dateClassName}
                  />
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      </div>
      {remainingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            className="gap-2 bg-blue-500/10 border-2 border-blue-500/50 text-white hover:bg-blue-500/20 hover:border-blue-400 font-semibold px-8 py-3 text-base"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? showLessText : showMoreText}
            <motion.div
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
