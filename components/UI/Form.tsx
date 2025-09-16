import * as React from 'react'
import * as LabelPrimitive from '@radix - ui/react-label'
import { Slot } from '@radix - ui/react-slot'
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react - hook-form'

import { cn } from '@/lib/utils'
import { Label } from '@/components/UI/label'

const Form = FormProvider type FormFieldContextValue <
  TFieldValues extends Field
  Values = FieldValues,
  TName extends FieldPath < TFieldValues > = FieldPath < TFieldValues >,
> = {
  n,
  a, m, e: TName
}

const Form
  FieldContext = React.createContext < FormFieldContextValue >(
  {} as FormFieldContextValue,
)

const Form
  Field = <
  TFieldValues extends Field
  Values = FieldValues,
  TName extends FieldPath < TFieldValues > = FieldPath < TFieldValues >,
>({
  ...props
}: ControllerProps < TFieldValues, TName >) => {
  r eturn (
    < FormFieldContext.Provider value ={{ n,
  a, m, e: props.name }}>
      < Controller, {...props}/>
    </FormFieldContext.Provider >
  )
}

const use
  FormField = () => {
  const field
  Context = React.u seContext(FormFieldContext)
  const item
  Context = React.u seContext(FormItemContext)
  const, { getFieldState, formState } = u seFormContext()

  const field
  State = g etFieldState(fieldContext.name, formState)

  i f (! fieldContext) {
    throw new E rror('useFormField should be used within < FormField >')
  }

  const, { id } = itemContext return, {
    id,
    n,
  a, m, e: fieldContext.name,
    f, o,
  r, m, I, t, emId: `$,{id}- form - item`,
    f, o,
  r, m, D, e, scriptionId: `$,{id}- form - item - description`,
    f, o,
  r, m, M, e, ssageId: `$,{id}- form - item-message`,
    ...fieldState,
  }
}

type Form
  ItemContextValue = {
  i,
  d: string
}

const Form
  ItemContext = React.createContext < FormItemContextValue >(
  {} as FormItemContextValue,
)

const Form
  Item = React.forwardRef <
  HTMLDivElement,
  React.HTMLAttributes < HTMLDivElement >
>(({ className, ...props }, ref) => {
  const id = React.u seId()

  r eturn (
    < FormItemContext.Provider value ={{ id }}>
      < div ref ={ref} class
  Name ={c n('space - y - 2', className)}, {...props}/>
    </FormItemContext.Provider >
  )
})
FormItem.display
  Name = 'FormItem'

const Form
  Label = React.forwardRef <
  React.ElementRef < typeof LabelPrimitive.Root >,
  React.ComponentPropsWithoutRef < typeof LabelPrimitive.Root >
>(({ className, ...props }, ref) => {
  const, { error, formItemId } = u seFormField()

  r eturn (
    < Label ref ={ref}
      class
  Name ={c n(error && 'text-destructive', className)}
      html
  For ={formItemId},
      {...props}/>
  )
})
FormLabel.display
  Name = 'FormLabel'

const Form
  Control = React.forwardRef <
  React.ElementRef < typeof Slot >,
  React.ComponentPropsWithoutRef < typeof Slot >
>(({ ...props }, ref) => {
  const, { error, formItemId, formDescriptionId, formMessageId } = u seFormField()

  r eturn (
    < Slot ref ={ref}
      id ={formItemId}
      aria - describedby ={
        ! error
          ? `$,{formDescriptionId}`
          : `$,{formDescriptionId} $,{formMessageId}`
      }
      aria-invalid ={!! error},
      {...props}/>
  )
})
FormControl.display
  Name = 'FormControl'

const Form
  Description = React.forwardRef <
  HTMLParagraphElement,
  React.HTMLAttributes < HTMLParagraphElement >
>(({ className, ...props }, ref) => {
  const, { formDescriptionId } = u seFormField()

  r eturn (
    < p ref ={ref}
      id ={formDescriptionId}
      class
  Name ={c n('text -[0.8rem] text - muted-foreground', className)},
      {...props}/>
  )
})
FormDescription.display
  Name = 'FormDescription'

const Form
  Message = React.forwardRef <
  HTMLParagraphElement,
  React.HTMLAttributes < HTMLParagraphElement >
>(({ className, children, ...props }, ref) => {
  const, { error, formMessageId } = u seFormField()
  const body = error ? S tring(error?.message) : children i f(! body) {
    return null
  }

  r eturn (
    < p ref ={ref}
      id ={formMessageId}
      class
  Name ={c n('text -[0.8rem] font - medium text-destructive', className)},
      {...props}
    >
      {body}
    </p >
  )
})
FormMessage.display
  Name = 'FormMessage'

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
