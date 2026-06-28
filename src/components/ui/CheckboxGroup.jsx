export function CheckboxGroup({ name, legend, options, values = [], onChange }) {
  const toggle = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value))
    } else {
      onChange([...values, value])
    }
  }

  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold text-charcoal">{legend}</legend>
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const id = `${name}-${option.value}`
          const checked = values.includes(option.value)

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                checked
                  ? 'border-civic-purple bg-civic-purple-light ring-1 ring-civic-purple'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                id={id}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => toggle(option.value)}
                className="h-4 w-4 rounded accent-civic-purple"
              />
              <span className="text-sm font-medium text-charcoal">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
