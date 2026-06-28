export function RadioGroup({ name, legend, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold text-charcoal">{legend}</legend>
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const id = `${name}-${option.value}`
          const checked = value === option.value

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
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-civic-purple"
              />
              <span className="text-sm font-medium text-charcoal">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
