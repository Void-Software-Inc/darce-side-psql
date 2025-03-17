"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const videoTypes = [
  {
    value: "instructional",
    label: "Instructional",
  },
  {
    value: "match",
    label: "Match",
  },
  {
    value: "tournament",
    label: "Tournament",
  },
]

interface TypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-[#222222] border-[#2a2a2a] text-gray-200 hover:bg-[#2a2a2a] hover:text-gray-200"
        >
          {value
            ? videoTypes.find((type) => type.value === value)?.label
            : "Select type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-[#222222] border-[#2a2a2a]">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Search type..." 
            className="h-9 border-none bg-transparent text-gray-200" 
          />
          <CommandList>
            <CommandEmpty>No type found.</CommandEmpty>
            <CommandGroup>
              {videoTypes.map((type) => (
                <CommandItem
                  key={type.value}
                  value={type.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="text-gray-200 aria-selected:bg-[#2a2a2a]"
                >
                  {type.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === type.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 