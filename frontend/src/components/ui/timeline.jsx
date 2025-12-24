import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

function DesktopTimelineEntry({
  item,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
}) {
  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-9 gap-4 items-center group">
        <dl className="col-span-2 pr-4">
          <dt className="sr-only">Date</dt>
          <dd
            className={cn(
              "text-base font-medium text-gray-300 transition-colors group-hover:text-white",
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
        <div className="col-span-7 flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div
              className={cn("h-16 border-l-2 border-gray-600", lineClassName)}
            />
            <div
              className={cn(
                "absolute -left-[5px] top-[1.6875rem] flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-blue-400/30 transition-colors group-hover:bg-blue-400 group-hover:ring-blue-300/50",
                !item.icon && "h-2.5 w-2.5",
                dotClassName
              )}
            >
              {item.icon && (
                <div className="h-3 w-3 text-white">{item.icon}</div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-4">
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
                  "text-base text-gray-300 leading-relaxed",
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

function MobileTimelineEntry({
  item,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
}) {
  return (
    <div className="flex items-center space-x-4 rounded-lg px-4 py-3 md:hidden">
      <div className="relative">
        <div className={cn("h-16 border-l border-gray-700", lineClassName)} />
        <div
          className={cn(
            "absolute -left-1 top-5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/60",
            !item.icon && "h-2.5 w-2.5",
            dotClassName
          )}
        >
          {item.icon && (
            <div className="h-3 w-3 text-white">{item.icon}</div>
          )}
        </div>
      </div>
      <div>
        <dl>
          <dt className="sr-only">Date</dt>
          <dd
            className={cn(
              "text-sm font-medium text-gray-400",
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
        <h3
          className={cn(
            "text-lg font-medium tracking-tight text-white",
            titleClassName
          )}
        >
          {item.title}
        </h3>
        {item.description && (
          <p
            className={cn(
              "text-sm text-gray-400",
              descriptionClassName
            )}
          >
            {item.description}
          </p>
        )}
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
    <div className={cn("mx-5 max-w-2xl md:mx-auto relative z-20", className)}>
      <div>
        <ul className="space-y-8">
          {initialItems.map((item, index) => (
            <motion.li
              key={index}
              initial={showAnimation ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationDuration,
                delay: index * animationDelay,
              }}
            >
              <DesktopTimelineEntry
                item={item}
                dotClassName={dotClassName}
                lineClassName={lineClassName}
                titleClassName={titleClassName}
                descriptionClassName={descriptionClassName}
                dateClassName={dateClassName}
              />
              <MobileTimelineEntry
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
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: animationDuration,
                    delay: index * animationDelay,
                  }}
                >
                  <DesktopTimelineEntry
                    item={item}
                    dotClassName={dotClassName}
                    lineClassName={lineClassName}
                    titleClassName={titleClassName}
                    descriptionClassName={descriptionClassName}
                    dateClassName={dateClassName}
                  />
                  <MobileTimelineEntry
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
